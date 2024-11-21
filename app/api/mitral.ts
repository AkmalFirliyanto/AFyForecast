import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
});

export async function generateText(prompt: string) {
  try {
    const response = await mistral.chat.complete({
      model: "mistral-medium",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 1000
    });
    
    const text = response.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Respons kosong dari AI');
    }
    
    return text;

  } catch (error: any) {
    console.error('Mistral API Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Throw error dengan pesan yang lebih jelas
    throw new Error(
      error.message?.includes('API key') ? 'Masalah dengan API key' :
      error.message?.includes('quota') ? 'Kuota API habis' :
      'Gagal mengakses AI service'
    );
  }
} 