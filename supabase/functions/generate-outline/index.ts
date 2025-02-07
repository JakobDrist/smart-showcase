
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, slideCount, language } = await req.json();

    const systemPrompt = `Du er en professionel præsentationsekspert. 
    Generer en disposition med ${slideCount} punkter til en præsentation på ${language === 'da' ? 'dansk' : 'engelsk'}.
    Dispositionen skal være velstruktureret og professionel.
    Formater hvert punkt som et JSON objekt med et id og en title.`;

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
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const outlineText = data.choices[0].message.content;
    
    // Parse the JSON string to ensure it's valid
    let outline;
    try {
      outline = JSON.parse(outlineText);
    } catch (e) {
      // If parsing fails, try to extract array from the text
      const match = outlineText.match(/\[[\s\S]*\]/);
      if (match) {
        outline = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    return new Response(JSON.stringify({ outline }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-outline function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
