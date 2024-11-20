'use client'

import { useState } from 'react'
import Layout from '../components/layout'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { clearTarotCache } from '@/lib/cache';
import { shuffleCards } from '@/lib/tarot-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/translations'

interface TarotCard {
  id: string;
  name: {
    id: string;
    en: string;
  };
  image: string;
  meaning: {
    upright: {
      id: string;
      en: string;
    };
    reversed: {
      id: string;
      en: string;
    };
  };
  element: {
    id: string;
    en: string;
  };
  keywords: {
    id: string[];
    en: string[];
  };
  type: string;
  position?: 'upright' | 'reversed';
}

export default function TarotForecast() {
  const { language } = useLanguage()
  const [cards, setCards] = useState<TarotCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isFlipped, setIsFlipped] = useState<boolean[]>([false, false, false])
  const [showInterpretation, setShowInterpretation] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const t = translations[language]

  const generateAIInterpretation = async () => {
    setIsGeneratingAI(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const formattedCards = cards.map(card => ({
        name: {
          id: card.name.id,
          en: card.name.en
        },
        position: card.position,
        meaning: {
          upright: {
            id: card.meaning.upright.id,
            en: card.meaning.upright.en
          },
          reversed: {
            id: card.meaning.reversed.id,
            en: card.meaning.reversed.en
          }
        },
        keywords: {
          id: card.keywords.id,
          en: card.keywords.en
        }
      }));

      const response = await fetch('/api/zodiac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user',
          'Accept-Language': language
        },
        body: JSON.stringify({
          type: 'tarot-interpretation',
          language,
          cards: formattedCards
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || (language === 'id' 
          ? 'Terjadi kesalahan saat memproses permintaan'
          : 'An error occurred while processing the request'
        ));
      }

      const data = await response.json();
      
      if (!data.interpretation) {
        throw new Error(language === 'id'
          ? 'Tidak ada interpretasi yang diterima'
          : 'No interpretation received'
        );
      }

      setAiInterpretation(data.interpretation);

    } catch (error: any) {
      console.error('Error generating AI interpretation:', error);
      
      let errorMessage = language === 'id'
        ? 'Maaf, terjadi kesalahan dalam menghasilkan interpretasi. Silakan coba lagi.'
        : 'Sorry, an error occurred while generating the interpretation. Please try again.';

      if (error.name === 'AbortError') {
        errorMessage = language === 'id'
          ? 'Waktu permintaan habis. Silakan coba lagi.'
          : 'Request timeout. Please try again.';
      }

      setAiInterpretation(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleShare = async () => {
    const shareText = language === 'id'
      ? `🔮 ${translations[language].myTarotReading}:\n\n${cards.map((card, i) => 
        `${i + 1}. ${card.name[language]} (${card.position === 'upright' ? translations[language].upright : translations[language].reversed})`
      ).join('\n')}\n\n${aiInterpretation}\n\n${translations[language].shareMessage}\nhttps://afy-forecast.vercel.app`
      : `🔮 ${translations[language].myTarotReading}:\n\n${cards.map((card, i) => 
        `${i + 1}. ${card.name[language]} (${card.position === 'upright' ? translations[language].upright : translations[language].reversed})`
      ).join('\n')}\n\n${aiInterpretation}\n\n${translations[language].shareMessage}\nhttps://afy-forecast.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: translations[language].myTarotReading,
          text: shareText
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(shareText)
      alert(translations[language].textCopiedToClipboard)
    }
  }

  const drawCards = async () => {
    setIsLoading(true)
    setIsShuffling(true)
    setIsFlipped([false, false, false])
    setShowInterpretation(false)
    setCards([])

    try {
      const response = await fetch('/api/zodiac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'tarot' })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      
      setTimeout(() => {
        setIsShuffling(false)
        setCards(data)
      }, 1000)
      
    } catch (error) {
      console.error('Error:', error)
      setCards([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = (index: number) => {
    if (!isFlipped[index]) {
      const newFlipped = [...isFlipped]
      newFlipped[index] = true
      setIsFlipped(newFlipped)

      if (newFlipped.every(flipped => flipped)) {
        setTimeout(() => setShowInterpretation(true), 1000)
      }
    }
  }

  const handleShuffle = async () => {
    setIsShuffling(true);
    setAiInterpretation(''); // Reset interpretasi
    setIsFlipped([false, false, false]); // Reset flip state
    setShowInterpretation(false); // Reset tampilan interpretasi
    
    // Bersihkan cache sebelum mengocok kartu baru
    await clearTarotCache();
    
    // Acak kartu
    const shuffledCards = shuffleCards();
    setCards(shuffledCards);
    
    setTimeout(() => {
      setIsShuffling(false);
    }, 1000);
  };

  const displayCardName = (card: TarotCard) => {
    return card.name[language]
  }

  const displayMeaning = (card: TarotCard) => {
    return card.position === 'upright' 
      ? card.meaning.upright[language]
      : card.meaning.reversed[language]
  }

  return (
    <Layout>
      <div className="min-h-screen py-4">
        {cards.length === 0 ? (
          // Tampilan awal - centered
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h1 className="text-3xl font-bold text-center mb-8">{translations[language].tarotTitle}</h1>
            <button
              onClick={handleShuffle}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              {isLoading ? translations[language].shufflingCards : translations[language].shuffleCards}
            </button>
          </div>
        ) : (
          // Tampilan setelah kartu dikocok - di atas
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{translations[language].tarotTitle}</h1>
              <button
                onClick={handleShuffle}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                {isLoading ? translations[language].shufflingCards : translations[language].shuffleCards}
              </button>
            </div>

            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl mx-auto">
                {cards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative aspect-[2/3] w-full h-[700px] max-w-[400px] mx-auto"
                  >
                    <div
                      className={`absolute w-full h-full cursor-pointer preserve-3d transition-all duration-700
                        ${isFlipped[index] ? 'rotate-y-180' : ''}`}
                      onClick={() => handleCardClick(index)}
                    >
                      {/* Back of card */}
                      <div className="absolute w-full h-full backface-hidden">
                        <Image
                          src="/tarot/back/card-back.jpg"
                          alt="Card Back"
                          fill
                          className="rounded-xl shadow-2xl object-cover"
                          priority
                        />
                      </div>

                      {/* Front of card */}
                      <div className="absolute w-full h-full backface-hidden rotate-y-180">
                        <Image
                          src={card.image}
                          alt={card.name[language]}
                          fill
                          className={`rounded-xl shadow-2xl object-cover
                            ${card.position === 'reversed' ? 'rotate-180' : ''}`}
                          priority
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {showInterpretation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Interpretasi kartu individual */}
                  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-center">{translations[language].cardInterpretation}</h2>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 bg-purple-600/30 text-purple-200 px-4 py-2 rounded-lg hover:bg-purple-600/40 transition-colors"
                      >
                        <Share2 size={20} />
                        {translations[language].share}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {cards.map((card, index) => (
                        <div key={index} className="space-y-4">
                          <h3 className="text-xl font-medium">{displayCardName(card)}</h3>
                          <p className="text-gray-300">
                            {displayMeaning(card)}
                          </p>
                          <div>
                            <h4 className="font-medium mb-2">{translations[language].keywords}:</h4>
                            <div className="flex flex-wrap gap-2">
                              {card.keywords.en.map((keyword: string, i: number) => (
                                <span
                                  key={i}
                                  className="bg-purple-600/30 text-purple-200 px-2 py-1 rounded-full text-sm"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interpretasi AI */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg"
                  >
                    <h2 className="text-2xl font-semibold mb-4">{translations[language].conclusion}</h2>
                    {!aiInterpretation && !isGeneratingAI && (
                      <button
                        onClick={generateAIInterpretation}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <span>{translations[language].getFullInterpretation}</span>
                      </button>
                    )}
                    {isGeneratingAI && (
                      <div className="flex items-center gap-3 text-purple-300">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
                        <p>{translations[language].analyzingCards}</p>
                      </div>
                    )}
                    {aiInterpretation && (
                      <div className="space-y-4">
                        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{aiInterpretation}</p>
                        <button
                          onClick={() => setAiInterpretation('')}
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          {translations[language].regenerateInterpretation}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}