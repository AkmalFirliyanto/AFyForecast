'use client'

import { useState, useEffect } from 'react'
import Layout from '../components/layout'
import Image from 'next/image'
import {
  FacebookShareButton, TwitterShareButton, WhatsappShareButton, TelegramShareButton,
  FacebookIcon, TwitterIcon, WhatsappIcon, TelegramIcon
} from 'react-share'
import { useRouter } from 'next/navigation'
import { zodiacProfiles } from '@/data/zodiac-profiles'
import { useLanguage } from '@/contexts/LanguageContext'

interface Forecast {
  career: string;
  love: string;
  health: string;
  tips: string;
  date: string;
  isError?: boolean;
}

const zodiacs = [
  { name: 'Aries', image: '/zodiac/aries.svg' },
  { name: 'Taurus', image: '/zodiac/taurus.svg' },
  { name: 'Gemini', image: '/zodiac/gemini.svg' },
  { name: 'Cancer', image: '/zodiac/cancer.svg' },
  { name: 'Leo', image: '/zodiac/leo.svg' },
  { name: 'Virgo', image: '/zodiac/virgo.svg' },
  { name: 'Libra', image: '/zodiac/libra.svg' },
  { name: 'Scorpio', image: '/zodiac/scorpio.svg' },
  { name: 'Sagittarius', image: '/zodiac/sagittarius.svg' },
  { name: 'Capricorn', image: '/zodiac/capricorn.svg' },
  { name: 'Aquarius', image: '/zodiac/aquarius.svg' },
  { name: 'Pisces', image: '/zodiac/pisces.svg' }
]

export default function ZodiacForecast() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [selectedZodiac, setSelectedZodiac] = useState('')
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sign = params.get('sign')
    if (sign) {
      handleZodiacSelect(sign)
    }
  }, [])

  const getForecast = async (zodiac: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/zodiac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'default-user',
          'Accept-Language': language
        },
        body: JSON.stringify({ 
          zodiac,
          type: 'zodiac',
          language
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          const remaining = parseInt(data.remaining) || 300000;
          const remainingMinutes = Math.max(1, Math.ceil(remaining / 60000));
          throw new Error(language === 'id' 
            ? `Batas penggunaan tercapai. Silakan coba lagi dalam ${remainingMinutes} menit`
            : `Usage limit reached. Please try again in ${remainingMinutes} minutes`
          );
        }
        throw new Error(language === 'id' 
          ? 'Terjadi kesalahan saat mengambil ramalan'
          : 'An error occurred while fetching the forecast'
        );
      }

      const data = await response.json();
      
      if (!data || !data.career) {
        throw new Error(language === 'id'
          ? 'Format data ramalan tidak valid'
          : 'Invalid forecast data format'
        );
      }
      
      setForecast(data);
    } catch (error: any) {
      setForecast({
        career: error.message,
        love: '',
        health: '',
        tips: '',
        date: new Date().toISOString(),
        isError: true
      });
    } finally {
      setIsLoading(false)
    }
  }

  const handleZodiacSelect = (zodiac: string) => {
    setSelectedZodiac(zodiac)
    getForecast(zodiac)
    
    // Update URL
    const newUrl = `${window.location.pathname}?sign=${zodiac}`
    window.history.pushState({ path: newUrl }, '', newUrl)
  }

  const getShareUrl = () => {
    return `${window.location.origin}/zodiac?sign=${selectedZodiac}`
  }

  const getShareTitle = () => {
    return language === 'id'
      ? `Ramalan Zodiak ${selectedZodiac} - AFy Forecast`
      : `${selectedZodiac} Zodiac Forecast - AFy Forecast`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">{t('zodiacTitle')}</h1>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
          {zodiacs.map((zodiac) => (
            <button
              key={zodiac.name}
              onClick={() => handleZodiacSelect(zodiac.name)}
              className={`p-4 rounded-lg transition-all ${
                selectedZodiac === zodiac.name
                  ? 'bg-purple-600 scale-105'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Image
                src={zodiac.image}
                alt={zodiac.name}
                width={60}
                height={60}
                className="mx-auto mb-2"
              />
              <p className="text-center text-sm">{zodiac.name}</p>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-2">{t('forecastLoading')}</p>
            </div>
          ) : selectedZodiac && forecast ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">
                  {t('forecastFor')} {selectedZodiac}
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t('profileTitle')}</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="text-gray-400">{t('date')}:</span> {
                          zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].date[language as keyof typeof zodiacProfiles[keyof typeof zodiacProfiles]['date']]
                        }
                      </p>
                      <p>
                        <span className="text-gray-400">{t('element')}:</span> {
                          zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].element[language]
                        }
                      </p>
                      <p>
                        <span className="text-gray-400">{t('planet')}:</span> {
                          zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].planet[language]
                        }
                      </p>
                      <p>
                        <span className="text-gray-400">{t('characteristics')}:</span> {
                          zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].traits[language].join(', ')
                        }
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400">{t('strengths')}</h4>
                      <p>{zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].strengths.en.join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">{t('weaknesses')}</h4>
                      <p>{zodiacProfiles[selectedZodiac.toLowerCase() as keyof typeof zodiacProfiles].weaknesses.en.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{t('careerFinance')}</h3>
                    <p>{forecast.career}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('loveRelationships')}</h3>
                    <p>{forecast.love}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('healthEnergy')}</h3>
                    <p>{forecast.health}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('tipsAdvice')}</h3>
                    <p>{forecast.tips}</p>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4 mt-6">
                    <h3 className="font-semibold mb-3 text-center">{t('shareReading')}</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      <FacebookShareButton url={getShareUrl()} hashtag={getShareTitle()}>
                        <FacebookIcon size={32} round />
                      </FacebookShareButton>
                      
                      <TwitterShareButton url={getShareUrl()} title={getShareTitle()}>
                        <TwitterIcon size={32} round />
                      </TwitterShareButton>
                      
                      <WhatsappShareButton url={getShareUrl()} title={getShareTitle()}>
                        <WhatsappIcon size={32} round />
                      </WhatsappShareButton>
                      
                      <TelegramShareButton url={getShareUrl()} title={getShareTitle()}>
                        <TelegramIcon size={32} round />
                      </TelegramShareButton>

                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all
                          ${copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                          }`}
                        title="Copy Link"
                      >
                        {copied ? (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <div className={`text-center mt-2 transition-opacity duration-200 
                      ${copied ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <p className="text-sm text-green-400">{t('linkCopied')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  )
}