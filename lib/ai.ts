import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function chatCompletion(messages: Array<{ role: string; content: string }>) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  })
  return response.choices[0]?.message?.content || ''
}

export async function visionCompletion(prompt: string, imageBase64: string, mimeType: string) {
  const OpenAI = await import('openai')
  const openai = new OpenAI.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: 500,
  })
  
  return response.choices[0]?.message?.content || ''
}
