
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { outline, language } = await req.json();

    if (!outline || !Array.isArray(outline)) {
      throw new Error('Invalid outline format');
    }

    console.log('Received request with outline:', outline);

    // Create a new presentation record
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

    // Generate content for each slide
    const slides = [];
    for (const [index, slide] of outline.entries()) {
      const systemPrompt = `Du er en professionel præsentationsekspert.
      Generer indhold til et slide med titlen "${slide.title}".
      Sproget skal være på ${language === 'da' ? 'dansk' : 'engelsk'}.
      Indholdet skal være kortfattet og præcist, perfekt til en præsentation.
      Formater teksten med simple markdown bullet points.
      Maksimalt 5 bullet points.`;

      console.log(`Generating content for slide ${index + 1}:`, slide.title);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generer indhold til præsentationsslide: ${slide.title}` }
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
      const content = data.choices[0].message.content;

      console.log(`Generated content for slide ${index + 1}:`, content);

      // Insert the slide into database
      const { error: slideError } = await supabase
        .from('slides')
        .insert({
          presentation_id: presentation.id,
          position: index,
          title: slide.title,
          content: content,
          style: {
            titleColor: '#1a1a1a',
            contentColor: '#4a4a4a',
            fontSize: 'text-lg',
          }
        });

      if (slideError) {
        console.error('Error creating slide:', slideError);
        throw slideError;
      }
      
      slides.push({
        title: slide.title,
        content: content,
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
