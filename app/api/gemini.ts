import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateText(prompt: string, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;
  
  while (attempt < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from AI');
      }
      
      return text;

    } catch (error: any) {
      lastError = error;
      attempt++;
      
      console.error(`Attempt ${attempt} failed:`, {
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
        
        console.log(`Retrying in ${delayMs}ms... (${isOverloaded ? 'Server Overloaded' : 'Normal Retry'})`);
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