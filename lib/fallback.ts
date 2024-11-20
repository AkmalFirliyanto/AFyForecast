import { generateText as huggingFaceGenerate } from '../app/api/huggingface';
import { FirebaseRateLimiter } from './rate-limiter';
import { sendDiscordAlert } from './notifications';
import { APIUsageTracker } from './api-usage';

export async function generateForecast(prompt: string, type: 'zodiac' | 'tarot') {
  try {
    const result = await huggingFaceGenerate(prompt);
    return result;
  } catch (error) {
    console.error('Hugging Face API error:', error);
    await sendDiscordAlert({
      type: 'ERROR',
      message: 'Hugging Face API failed',
      details: { error }
    });
    
    throw new Error('Gagal mendapatkan ramalan. Silakan coba lagi nanti.');
  }
}

export async function handler(req: Request) {
  try {
    const { type, prompt } = await req.json();
    const userId = req.headers.get('user-id');

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID diperlukan'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cek rate limit
    const rateLimiter = new FirebaseRateLimiter();
    const hasLimit = await rateLimiter.checkUserLimit(userId);
    
    if (!hasLimit) {
      const remaining = await rateLimiter.getRemainingLimit(userId);
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        remaining
      }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Track API usage
    const usageTracker = APIUsageTracker.getInstance();
    const canProceed = await usageTracker.trackRequest('/api/generate');
    
    if (!canProceed) {
      await sendDiscordAlert({
        type: 'WARNING',
        message: 'Daily API budget exceeded',
        details: { userId, endpoint: '/api/generate' }
      });
      
      return new Response(JSON.stringify({
        error: 'Batas penggunaan harian tercapai'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await generateForecast(prompt, type);
    
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('API error:', error);
    
    await sendDiscordAlert({
      type: 'ERROR',
      message: 'System error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    
    return new Response(JSON.stringify({
      error: 'Layanan sedang tidak tersedia'
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export { handler as POST }; 