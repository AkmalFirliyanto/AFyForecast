'use client'

import Layout from '../components/layout'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ChoiceForecast() {
  const { t } = useLanguage()
  
  return (
    <Layout>
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-full max-w-4xl px-4">
          <h1 className="text-4xl font-bold mb-6 text-center">{t('readingTitle')}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
              <h2 className="text-2xl font-semibold mb-4">{t('zodiac')}</h2>
              <Image 
                src="/zodiak.png"
                alt="Zodiac" 
                width={200} 
                height={200} 
                className="mb-4 rounded-lg hover:scale-105 transition-transform"
                priority
              />
              <Link href="/zodiac" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                {t('getZodiacReading')}
              </Link>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
              <h2 className="text-2xl font-semibold mb-4">{t('tarot')}</h2>
              <Image 
                src="/tarot.png"
                alt="Tarot" 
                width={200} 
                height={200} 
                className="mb-4 rounded-lg hover:scale-105 transition-transform"
                priority
              />
              <Link href="/tarot" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                {t('getTarotReading')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}