'use client'

import Link from 'next/link'
import { Coffee } from 'lucide-react'
import Layout from './components/layout'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white -mt-16">
        <div className="text-center w-full max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-8">
            <span className="text-purple-400">AFy</span> Forecast
          </h1>
          <p className="text-xl mb-12">
            {t('tagline')}
          </p>
          <div className="flex justify-center items-center space-x-4">
            <Link href="/auth">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
                {t('start')}
              </button>
            </Link>
            
            <Link 
              href="https://bagibagi.co/akmalfy" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
                <Coffee size={20} />
                {t('buyMeCoffee')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}