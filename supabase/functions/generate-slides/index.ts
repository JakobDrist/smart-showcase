
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const slides = [];
    for (const [index, slide] of outline.entries()) {
      // Generate an engaging image for the slide
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

      // Download the image and upload to Supabase Storage
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

      // Generate enhanced content for the slide with a very strict system prompt
      const systemPrompt = `You are a professional presentation expert.
      Your task is to generate content for a slide titled "${slide.title}" in ${language === 'da' ? 'Danish' : 'English'}.
      You MUST format your response as a valid JSON object with this exact structure:
      {
        "points": ["point 1", "point 2", "point 3"],
        "diagram": null,
        "data": null,
        "layout": "vertical"
      }
      
      Rules:
      - points array MUST contain between 1-5 bullet points
      - diagram MUST be either null, "pie", "bar", or "line"
      - data MUST be null if diagram is null
      - layout MUST be either "grid", "vertical", or "horizontal"
      - ALL points must be strings, no nested objects or arrays
      - Do NOT include any markdown or special formatting in the points
      
      Return ONLY the JSON object, no other text.`;

      console.log(`Generating content for slide ${index + 1}:`, slide.title);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate content for presentation slide: ${slide.title}` }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('OpenAI raw response:', data.choices[0].message.content);
      
      let contentData;
      try {
        contentData = JSON.parse(data.choices[0].message.content.trim());
        
        // Validate the response structure
        if (!Array.isArray(contentData.points) || 
            !contentData.points.every(point => typeof point === 'string') ||
            !['grid', 'vertical', 'horizontal'].includes(contentData.layout) ||
            ![null, 'pie', 'bar', 'line'].includes(contentData.diagram)) {
          throw new Error('Invalid response structure');
        }
      } catch (error) {
        console.error('Error parsing or validating OpenAI response:', error);
        console.error('Raw response content:', data.choices[0].message.content);
        throw new Error('Failed to parse or validate OpenAI response');
      }

      // Format the content based on the AI response
      const formattedContent = contentData.points.map(point => `• ${point}`).join('\n');

      // Insert the slide with enhanced styling
      const { error: slideError } = await supabase
        .from('slides')
        .insert({
          presentation_id: presentation.id,
          position: index,
          title: slide.title,
          content: formattedContent,
          background_image: publicUrl,
          background_type: 'image',
          style: {
            titleColor: '#ffffff',
            contentColor: '#ffffff',
            fontSize: 'text-xl',
            diagram: contentData.diagram,
            diagramData: contentData.data,
            layout: contentData.layout,
          },
          bullet_style: 'circle',
          grid_layout: contentData.layout || 'vertical',
          gradient: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
        });

      if (slideError) {
        console.error('Error creating slide:', slideError);
        throw slideError;
      }
      
      slides.push({
        title: slide.title,
        content: formattedContent,
        background_image: publicUrl,
        style: {
          diagram: contentData.diagram,
          diagramData: contentData.data,
          layout: contentData.layout,
        }
      });
    }

    return new Response(
      JSON.stringify({ presentationId: presentation.id, slides }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-slides function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
