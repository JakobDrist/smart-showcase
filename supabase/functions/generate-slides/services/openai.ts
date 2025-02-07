
export async function generateImage(apiKey: string, prompt: string): Promise<string> {
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
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
  return imageData.data[0].url;
}

export async function generateContent(apiKey: string, title: string, language: string): Promise<Response> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are a professional presentation expert. Generate content for slide titled "${title}" in ${language === 'da' ? 'Danish' : 'English'}. Focus on creating clear, concise points.`
        },
        { 
          role: 'user', 
          content: `Generate content for presentation slide: ${title}`
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

  return response;
}

