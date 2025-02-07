
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function* streamOpenAIResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.trim() === 'data: [DONE]') return;
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(5));
        if (data.choices[0].delta.content) {
          yield data.choices[0].delta.content;
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  try {
    // Først opretter vi storage bucket hvis det ikke eksisterer
    try {
      const { data: buckets } = await supabase
        .storage
        .listBuckets();
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'presentation_images');
      
      if (!bucketExists) {
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('presentation_images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg'],
            fileSizeLimit: 5242880, // 5MB
          });

        if (createBucketError) {
          throw createBucketError;
        }
      }
    } catch (bucketError) {
      console.error('Error managing storage bucket:', bucketError);
      throw new Error('Failed to setup storage bucket');
    }

    const { outline, language } = await req.json();

    if (!outline || !Array.isArray(outline)) {
      throw new Error('Invalid outline format');
    }

    console.log('Received request with outline:', outline);

    const { data: presentation, error: presentationError } = await supabase
      .from('presentations')
      .insert({ title: outline[0].title })
      .select()
      .single();

    if (presentationError) {
      console.error('Error creating presentation:', presentationError);
      throw presentationError;
    }

    console.log('Created presentation:', presentation);

    for (const [index, slide] of outline.entries()) {
      const imagePrompt = `Create a modern, minimalist presentation slide background image for topic: ${slide.title}. The image should be subtle and not interfere with text overlay.`;
      
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!imageResponse.ok) {
        const error = await imageResponse.text();
        console.error('OpenAI Image API error:', error);
        throw new Error(`OpenAI Image API error: ${error}`);
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.data[0].url;

      const imageDownloadResponse = await fetch(imageUrl);
      const imageBlob = await imageDownloadResponse.blob();
      
      const filePath = `${crypto.randomUUID()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('presentation_images')
        .upload(filePath, imageBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('presentation_images')
        .getPublicUrl(filePath);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { 
              role: 'system', 
              content: `You are a professional presentation expert. Generate content for slide titled "${slide.title}" in ${language === 'da' ? 'Danish' : 'English'}. Focus on creating clear, concise points.`
            },
            { 
              role: 'user', 
              content: `Generate content for presentation slide: ${slide.title}`
            }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      let slideContent = '';
      for await (const chunk of streamOpenAIResponse(response)) {
        slideContent += chunk;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', slide: index, content: chunk })}\n\n`));
      }

      const { error: slideError } = await supabase
        .from('slides')
        .insert({
          presentation_id: presentation.id,
          position: index,
          title: slide.title,
          content: slideContent,
          background_image: publicUrl,
          background_type: 'image',
          style: {
            titleColor: '#ffffff',
            contentColor: '#ffffff',
            fontSize: 'text-xl',
            layout: 'vertical',
          },
          bullet_style: 'circle',
          grid_layout: 'vertical',
          gradient: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
        });

      if (slideError) {
        console.error('Error creating slide:', slideError);
        throw slideError;
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'slide-complete', slide: index })}\n\n`));
    }

    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete', presentationId: presentation.id })}\n\n`));
    await writer.close();

    return new Response(responseStream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in generate-slides function:', error);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
    await writer.close();
    return new Response(responseStream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
});
