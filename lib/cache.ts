interface CacheData {
  forecast: any;
  timestamp: number;
  language: string;
}

// Simpan cache di memory menggunakan Map
const cacheStore = new Map<string, CacheData>();

function isNewDay(timestamp: number): boolean {
  const date = new Date(timestamp)
  const now = new Date()
  
  return (
    now.getDate() !== date.getDate() ||
    now.getMonth() !== date.getMonth() ||
    now.getFullYear() !== date.getFullYear()
  )
}

// Fungsi helper untuk membuat cache key
function getCacheKey(zodiac: string, language: string): string {
  return `${zodiac}-${language}`;
}

export async function getCachedForecast(zodiac: string, language: string): Promise<any | null> {
  try {
    const cacheKey = getCacheKey(zodiac, language);
    const data = cacheStore.get(cacheKey);
    
    if (!data) {
      console.log('Cache tidak ditemukan untuk zodiak:', zodiac, 'bahasa:', language);
      return null;
    }
    
    if (isNewDay(data.timestamp)) {
      console.log('Cache expired untuk zodiak:', zodiac, 'bahasa:', language);
      cacheStore.delete(cacheKey);
      return null;
    }
    
    console.log('Menggunakan cache untuk zodiak:', zodiac, 'bahasa:', language);
    return data.forecast;
    
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
}

export async function setCachedForecast(zodiac: string, forecast: any, language: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(zodiac, language);
    
    // Cek apakah forecast sudah ada di cache dan masih valid
    const existingData = cacheStore.get(cacheKey);
    if (existingData && !isNewDay(existingData.timestamp)) {
      console.log('Cache sudah ada untuk zodiak:', zodiac, 'bahasa:', language);
      return;
    }

    const cacheData: CacheData = {
      forecast,
      timestamp: Date.now(),
      language
    };
    
    cacheStore.set(cacheKey, cacheData);
    console.log('Menyimpan ramalan baru ke cache untuk zodiak:', zodiac, 'bahasa:', language);
    
    // Set timeout untuk menghapus cache di tengah malam
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      if (cacheStore.has(cacheKey)) {
        console.log('Menghapus cache untuk zodiak:', zodiac, 'bahasa:', language);
        cacheStore.delete(cacheKey);
      }
    }, timeUntilMidnight);
    
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function clearCachedForecast(zodiac: string): Promise<boolean> {
  try {
    const deleted = cacheStore.delete(zodiac)
    if (deleted) {
      console.log('Cache berhasil dihapus untuk zodiak:', zodiac)
    }
    return deleted
  } catch (error) {
    console.error('Error clearing cache:', error)
    return false
  }
}

interface TarotCard {
  name: string;
  position: string;
  meaning: string;
  id?: string;
}

interface TarotInterpretation {
  cards: Array<TarotCard>;
  interpretation: string;
  timestamp: number;
}

const tarotInterpretationCache = new Map<string, TarotInterpretation>();

export async function getCachedTarotInterpretation(cards: Array<TarotCard>): Promise<string | null> {
  try {
    // Buat key yang lebih unik dengan menambahkan meaning
    const key = cards
      .map((card, index) => 
        `${index}-${card.name}-${card.position}-${card.meaning.substring(0, 20)}`
      )
      .join('|');
    
    console.log('Mencoba mengakses cache dengan key:', key);
    const data = tarotInterpretationCache.get(key);
    
    // Tambahkan validasi timestamp (cache hanya valid selama 24 jam)
    if (data && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      console.log('Cache expired, menghapus...');
      tarotInterpretationCache.delete(key);
      return null;
    }
    
    if (!data) {
      console.log('Cache tarot tidak ditemukan untuk kombinasi:', key);
      return null;
    }
    
    console.log('Menggunakan cache tarot untuk kombinasi:', key);
    return data.interpretation;
    
  } catch (error) {
    console.error('Cache tarot error:', error);
    return null;
  }
}

export async function setCachedTarotInterpretation(
  cards: Array<TarotCard>, 
  interpretation: string
): Promise<void> {
  try {
    if (!cards || !Array.isArray(cards) || cards.length !== 3) {
      console.error('Data kartu tidak valid untuk disimpan:', cards);
      return;
    }

    // Gunakan key yang sama dengan fungsi get
    const key = cards
      .map((card, index) => 
        `${index}-${card.name}-${card.position}-${card.meaning.substring(0, 20)}`
      )
      .join('|');

    tarotInterpretationCache.set(key, {
      cards,
      interpretation,
      timestamp: Date.now()
    });
    
    console.log('Menyimpan interpretasi tarot ke cache untuk kombinasi:', key);
    
    // Bersihkan cache yang sudah expired setiap kali menyimpan data baru
    for (const [existingKey, data] of tarotInterpretationCache.entries()) {
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        tarotInterpretationCache.delete(existingKey);
        console.log('Menghapus cache expired untuk key:', existingKey);
      }
    }
    
  } catch (error) {
    console.error('Error setting tarot cache:', error);
  }
}

// Tambahkan fungsi baru untuk membersihkan cache tarot
export async function clearTarotCache(): Promise<void> {
  try {
    tarotInterpretationCache.clear();
    console.log('Cache tarot berhasil dibersihkan');
  } catch (error) {
    console.error('Error membersihkan cache tarot:', error);
  }
} 