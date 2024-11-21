import { NextResponse } from 'next/server'
import { getCachedForecast, setCachedForecast } from '@/lib/cache'
import { allTarotCards } from '@/data/tarot'
import { getCachedTarotInterpretation, setCachedTarotInterpretation } from '@/lib/cache'
import { generateText } from '../mitral'
import { FirebaseRateLimiter } from '@/lib/rate-limiter';
import { discordBot } from '@/lib/discord-bot';
import { shuffleCards } from '@/lib/tarot-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { zodiacProfiles } from '@/data/zodiac-profiles'


function extractSection(text: string, sectionName: string, language: string): string {
  // Definisikan mapping section names
  const sectionMappings = {
    career: {
      id: ['Karir', 'Karir dan Keuangan', 'Career'],
      en: ['Career', 'Career and Finance']
    },
    love: {
      id: ['Asmara', 'Cinta', 'Asmara dan Hubungan', 'Love'],
      en: ['Love', 'Love and Relationships']
    },
    health: {
      id: ['Kesehatan', 'Kesehatan dan Energi', 'Health'],
      en: ['Health', 'Health and Energy']
    },
    tips: {
      id: ['Tips', 'Saran', 'Saran dan Tips'],
      en: ['Tips', 'Advice', 'Suggestions']
    }
  };

  // Pilih array kata kunci berdasarkan bahasa dan section
  const keywords = sectionMappings[sectionName as keyof typeof sectionMappings][language as 'id' | 'en'];
  
  // Buat pattern regex yang mencakup semua kemungkinan kata kunci
  const pattern = keywords
    .map(keyword => `${keyword}:([^]*?)(?=\\n\\n|\\n(?:[A-Z]|${keywords.join('|')})|$)`)
    .join('|');
  
  const regex = new RegExp(pattern, 'i');
  const match = text.match(regex);
  
  if (!match) {
    console.log(`Failed to extract ${sectionName} from:`, text);
    return '';
  }
  
  // Ambil hasil yang tidak undefined
  const content = match.slice(1).find(group => group !== undefined);
  return content ? content.trim() : '';
}

// API Zodiak
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('user-id');
    const language = req.headers.get('Accept-Language') || 'id';
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID is required'
      }), { status: 400 });
    }

    const body = await req.json();
    const { type, zodiac, cards } = body;
    console.log('Request body:', { type, zodiac, cards });

    // Validasi input
    if (!type) {
      return new Response(JSON.stringify({
        error: 'Type is required'
      }), { status: 400 });
    }

    const rateLimiter = new FirebaseRateLimiter();
    const hasLimit = await rateLimiter.checkUserLimit(userId);
    
    if (!hasLimit) {
      const remaining = await rateLimiter.getRemainingTime(userId);
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        remaining
      }), { status: 429 });
    }

    // Jika request untuk zodiak
    if (type === 'zodiac' && zodiac) {
      console.log('Processing zodiac request for:', zodiac);
      
      const cachedForecast = await getCachedForecast(zodiac, language);
      if (cachedForecast && !cachedForecast.isError) {
        console.log('Returning cached forecast');
        return NextResponse.json(cachedForecast);
      }

      const zodiacProfile = zodiacProfiles[zodiac.toLowerCase() as keyof typeof zodiacProfiles];
      
      // Perbaikan format prompt untuk hasil yang lebih baik
      const prompt = language === 'id' 
        ? `Buat ramalan zodiak ${zodiac} untuk hari ini dengan format yang TEPAT seperti berikut:

           Karir: 
           [Berikan ramalan detail tentang karir dan keuangan dalam 2-3 kalimat]

           Asmara: 
           [Berikan ramalan detail tentang cinta dan hubungan dalam 2-3 kalimat]

           Kesehatan: 
           [Berikan ramalan detail tentang kesehatan dan energi dalam 2-3 kalimat]

           Tips: 
           [Berikan 2-3 saran spesifik dan praktis]

           Karakteristik zodiak yang perlu dipertimbangkan:
           - Elemen: ${zodiacProfile.element.id}
           - Planet: ${zodiacProfile.planet.id}
           - Sifat: ${zodiacProfile.traits.id.join(', ')}

           Berikan ramalan yang spesifik, personal, dan optimis. Gunakan bahasa yang formal dan profesional.`
        : `Create a detailed horoscope for ${zodiac} today using EXACTLY this format:

           Career: 
           [Provide detailed career and financial predictions in 2-3 sentences]

           Love: 
           [Provide detailed love and relationship predictions in 2-3 sentences]

           Health: 
           [Provide detailed health and energy predictions in 2-3 sentences]

           Tips: 
           [Provide 2-3 specific and practical suggestions]

           Consider these zodiac characteristics:
           - Element: ${zodiacProfile.element.en}
           - Planet: ${zodiacProfile.planet.en}
           - Traits: ${zodiacProfile.traits.en.join(', ')}

           Provide specific, personal, and optimistic predictions. Use formal and professional language.`;

      const response = await generateText(prompt);
      
      // Pastikan ekstraksi sesuai dengan bahasa yang dipilih
      const sections = language === 'id' 
        ? ['Karir', 'Asmara', 'Kesehatan', 'Tips']
        : ['Career', 'Love', 'Health', 'Tips'];
      
      const forecast = {
        career: '',
        love: '',
        health: '',
        tips: '',
        date: new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US'),
        isError: false
      };

      // Ekstrak setiap bagian sesuai bahasa
      const extractSection = (text: string, section: string) => {
        const regex = new RegExp(`${section}:([^]*?)(?=(?:${sections.join('|')}):|\$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : '';
      };
      if (language === 'id') {
        forecast.career = extractSection(response as string, 'Karir');
        forecast.love = extractSection(response as string, 'Asmara'); 
        forecast.health = extractSection(response as string, 'Kesehatan');
        forecast.tips = extractSection(response as string, 'Tips');
      } else {
        forecast.career = extractSection(response as string, 'Career');
        forecast.love = extractSection(response as string, 'Love');
        forecast.health = extractSection(response as string, 'Health');
        forecast.tips = extractSection(response as string, 'Tips');
      }

      // Validasi hasil
      const missingFields = Object.entries(forecast)
        .filter(([key, value]) => 
          ['career', 'love', 'health', 'tips'].includes(key) && typeof value === 'string' && !value.trim()
        )
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(
          language === 'id'
            ? `Format response tidak lengkap: ${missingFields.join(', ')} tidak ditemukan`
            : `Incomplete response format: ${missingFields.join(', ')} not found`
        );
      }

      await setCachedForecast(zodiac, forecast, language);
      return NextResponse.json(forecast);
    }

    // Jika request untuk tarot
    if (type === 'tarot') {
      const selectedCards = shuffleCards(3);
      return NextResponse.json(selectedCards);
    }

    // Jika request untuk interpretasi tarot
    if (type === 'tarot-interpretation' && cards) {
      console.log('Processing tarot interpretation for cards:', cards);
      
      // Validasi struktur kartu
      if (!Array.isArray(cards) || cards.length !== 3) {
        return NextResponse.json({ 
          error: 'Diperlukan tepat 3 kartu tarot'
        }, { status: 400 });
      }

      // Validasi struktur data setiap kartu
      for (const card of cards) {
        if (!card?.name?.id || !card?.name?.en || 
            !card?.position || 
            !card?.meaning?.upright?.id || !card?.meaning?.upright?.en ||
            !card?.meaning?.reversed?.id || !card?.meaning?.reversed?.en) {
          console.error('Invalid card structure:', card);
          return NextResponse.json({ 
            error: 'Format kartu tidak valid'
          }, { status: 400 });
        }
      }

      // Deteksi bahasa dari header
      const language = req.headers.get('Accept-Language') || 'id';
      const isEnglish = language.includes('en');

      // Gunakan nama dan makna kartu sesuai bahasa
      const cardDescriptions = cards.map((card, i) => {
        const name = isEnglish ? card.name.en : card.name.id;
        const meaning = isEnglish ? 
          card.meaning[card.position].en : 
          card.meaning[card.position].id;
        return `Card ${i + 1}: ${name} (${card.position}) - ${meaning}`;
      }).join('\n');

      const promptTemplate = isEnglish ? `
        You are a professional tarot reader. Based on these three cards:

        ${cardDescriptions}

        Provide a comprehensive reading with the following format (do not use any asterisks or bullet points):

        Main Theme:
        [A concise overview of the main message from all three cards combined]

        Your Cards:
        [List each card with its position and basic meaning, showing how each position affects the reading]
        - Position 1 (Past/Influence): [Card name] in [position] - [brief meaning]
        - Position 2 (Present/Challenge): [Card name] in [position] - [brief meaning]
        - Position 3 (Future/Outcome): [Card name] in [position] - [brief meaning]

        Card Relationships:
        [Explain how the cards connect and influence each other, noting any patterns or contrasts between positions]

        Guidance and Advice:
        [3-4 clear, actionable pieces of advice based on the cards, each on a new line with a dash (-)]

        Conclusion:
        [A final paragraph summarizing the key message and suggesting a path forward]` :
        `Anda adalah pembaca tarot profesional. Berdasarkan tiga kartu ini:

        ${cardDescriptions}

        Berikan pembacaan komprehensif dengan format berikut (jangan gunakan tanda asterisk atau poin):

        Tema Utama:
        [Gambaran singkat tentang pesan utama dari kombinasi ketiga kartu]

        Kartu Anda:
        [Sebutkan setiap kartu dengan posisi dan makna dasarnya, tunjukkan bagaimana setiap posisi mempengaruhi pembacaan]
        - Posisi 1 (Masa Lalu/Pengaruh): [Nama kartu] dalam posisi [posisi] - [makna singkat]
        - Posisi 2 (Masa Kini/Tantangan): [Nama kartu] dalam posisi [posisi] - [makna singkat]
        - Posisi 3 (Masa Depan/Hasil): [Nama kartu] dalam posisi [posisi] - [makna singkat]

        Hubungan Antar Kartu:
        [Jelaskan bagaimana kartu-kartu saling terhubung dan mempengaruhi, perhatikan pola atau kontras antar posisi]

        Panduan dan Saran:
        [3-4 saran yang jelas dan dapat ditindaklanjuti berdasarkan kartu, masing-masing pada baris baru dengan tanda (-)]

        Kesimpulan:
        [Paragraf akhir yang merangkum pesan kunci dan menyarankan langkah ke depan]`;

      try {
        const interpretation = await generateText(promptTemplate);
        if (!interpretation) {
          throw new Error('Tidak ada interpretasi yang dihasilkan');
        }

        if (typeof interpretation === 'string') {
          await setCachedTarotInterpretation(cards, interpretation);
          return NextResponse.json({ interpretation });
        } else {
          throw new Error('Interpretasi harus berupa string');
        }
        
      } catch (error) {
        console.error('Error dalam menghasilkan interpretasi tarot:', error);
        return NextResponse.json({ 
          error: isEnglish ? 
            'Failed to generate tarot interpretation' : 
            'Gagal menghasilkan interpretasi tarot'
        }, { status: 500 });
      }
    }

    return new Response(JSON.stringify({
      error: 'Invalid request type'
    }), { status: 400 });

  } catch (error: any) {
    console.error('Detailed server error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Kirim notifikasi ke Discord untuk error
    await discordBot.sendNotification(
      `Error in zodiac API: ${error.message}\nResponse: ${error.response?.data}`,
      'ERROR'
    );
    
    // Deteksi bahasa dari header request
    const language = req.headers.get('Accept-Language') || 'id';
    const isEnglish = language.includes('en');
    
    const errorResponse = isEnglish ? {
      career: 'Sorry, an error occurred while reading the forecast.',
      love: 'Please try again in a moment.',
      health: 'Server is experiencing issues.',
      tips: 'Please be patient.',
      date: new Date().toLocaleDateString('en-US'),
      isError: true
    } : {
      career: 'Maaf, terjadi kesalahan saat membaca ramalan.',
      love: 'Silakan coba lagi dalam beberapa saat.',
      health: 'Server sedang mengalami gangguan.',
      tips: 'Mohon bersabar.',
      date: new Date().toLocaleDateString('id-ID'),
      isError: true
    };
    
    return new Response(JSON.stringify(errorResponse), { 
      status: 500 
    });
  }
}

export async function GET(request: Request) {
  const isReady = discordBot.isReady();
  const ping = await discordBot.pingBot();
  const status = discordBot.getStatus();

  return Response.json({
    isReady,
    ping,
    status,
    timestamp: new Date().toISOString()
  });
}



