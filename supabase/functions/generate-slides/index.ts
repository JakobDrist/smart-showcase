
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "./utils/stream.ts";
import { setupStorageBucket, uploadAndGetImageUrl } from "./services/storage.ts";
import { generateImage, generateContent } from "./services/openai.ts";

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await setupStorageBucket(supabase);
    const { outline, language } = await req.json();

    if (!outline || !Array.isArray(outline)) {
      throw new Error('Invalid outline format');
    }

    console.log('Received request with outline:', outline);

    // Set up streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Create presentation
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

    // Process each slide
    for (const [index, slide] of outline.entries()) {
      try {
        const imagePrompt = `Create a modern, minimalist presentation slide background image for topic: ${slide.title}. The image should be subtle and not interfere with text overlay.`;
        
        const imageUrl = await generateImage(openAIApiKey, imagePrompt);
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const publicUrl = await uploadAndGetImageUrl(supabase, imageBlob);

        const response = await generateContent(openAIApiKey, slide.title, language);
        let slideContent = '';
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.trim() === 'data: [DONE]') continue;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.choices[0].delta.content) {
                  const content = data.choices[0].delta.content;
                  slideContent += content;
                  await writer.write(encoder.encode(
                    `data: ${JSON.stringify({ type: 'content', slide: index, content })}\n\n`
                  ));
                }
              } catch (e) {
                console.error('Error parsing stream:', e);
              }
            }
          }
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

        await writer.write(encoder.encode(
          `data: ${JSON.stringify({ type: 'slide-complete', slide: index })}\n\n`
        ));

      } catch (error) {
        console.error(`Error processing slide ${index}:`, error);
        await writer.write(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`
        ));
        throw error;
      }
    }

    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'complete', presentationId: presentation.id })}\n\n`
    ));
    await writer.close();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-slides function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
