'use client'

import { useState } from 'react'
import Layout from '../components/layout'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase/config'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Auth() {
  const { t } = useLanguage()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setError('')
      setIsLoading(true)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      console.error('Google login error:', error)
      setError(t('googleLoginError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      const errorMessage = error.code === 'auth/wrong-password' 
        ? t('wrongPassword')
        : error.code === 'auth/user-not-found'
        ? t('userNotFound')
        : error.code === 'auth/email-already-in-use'
        ? t('emailInUse')
        : t('genericError')
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] w-full max-w-md mx-auto px-4">
        <div className="w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? t('loginTitle') : t('signupTitle')}
          </h1>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white text-gray-900 font-medium py-2 px-4 rounded mb-6 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Image 
              src="/google.svg" 
              alt="Google" 
              width={20} 
              height={20} 
            />
            {isLoading ? t('loading') : t('continueWithGoogle')}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">{t('orContinueWith')}</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-1 text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
              disabled={isLoading}
            >
              {isLoading ? t('loading') : (isLogin ? t('loginTitle') : t('signupTitle'))}
            </button>
          </form>
          
          <p className="mt-4 text-center text-gray-300">
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-purple-400 hover:underline focus:outline-none ml-1"
            >
              {isLogin ? t('signupTitle') : t('loginTitle')}
            </button>
          </p>
          
          {error && (
            <p className="mt-4 text-center text-red-500 bg-red-100/10 p-2 rounded">
              {error}
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}