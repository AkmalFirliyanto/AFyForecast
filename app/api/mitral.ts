import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || ''
});

export async function generateText(prompt: string, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    try {
      console.log('Attempting Mistral API call...');
      console.log('API Key exists:', !!process.env.MISTRAL_API_KEY);
      
      const response = await mistral.chat.complete({
        model: "mistral-medium",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1000
      });
      
      console.log('Mistral API Response:', response);
      
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
      lastError = error;
      attempt++;
      
      console.error(`Percobaan ${attempt} gagal:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      // Cek error yang tidak perlu retry
      if (error.message?.includes('API key') || 
          error.message?.includes('quota') ||
          error.message?.includes('permission') ||
          error.message?.includes('invalid request')) {
        throw error;
      }

      // Tambah delay untuk retry
      const isOverloaded = error.message?.includes('503') || 
                          error.message?.includes('overloaded');
      
      if (attempt < maxRetries) {
        const baseDelay = isOverloaded ? 5000 : 1000;
        const delayMs = Math.min(baseDelay * attempt, 15000);
        
        console.log(`Mencoba ulang dalam ${delayMs}ms... (${isOverloaded ? 'Server Kelebihan Beban' : 'Retry Normal'})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  // Throw error terakhir dengan detail lebih jelas
  const errorMessage = lastError?.message?.includes('503') 
    ? 'Server AI sedang sibuk, silakan coba lagi dalam beberapa saat'
    : 'Gagal generate ramalan setelah beberapa percobaan';
    
  throw new Error(errorMessage);
} 