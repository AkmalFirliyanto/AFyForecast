'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useEffect } from 'react'
import { Coffee } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, loading] = useAuthState(auth)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    if (loading) return

    const protectedRoutes = ['/choice', '/zodiac', '/tarot']
    const publicOnlyRoutes = ['/auth']
    const isProtectedRoute = pathname ? protectedRoutes.includes(pathname) : false
    const isPublicOnlyRoute = pathname ? publicOnlyRoutes.includes(pathname) : false

    if (!user && isProtectedRoute) {
      router.replace('/auth')
    } else if (user && isPublicOnlyRoute) {
      router.replace('/choice')
    }
  }, [user, loading, pathname])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 py-4 fixed w-full top-0 z-50">
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-purple-400">AFy</span> Forecast
            </Link>

            <ul className="flex items-center space-x-6">
              <li className="flex items-center space-x-2">
                <button
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-1 rounded ${
                    language === 'id' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded ${
                    language === 'en' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  EN
                </button>
              </li>

              {user && (
                <>
                  <li>
                    <Link 
                      href="/choice" 
                      className={`hover:text-purple-400 ${pathname === '/choice' ? 'text-purple-400' : ''}`}
                    >
                      {t('chooseReading')}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/zodiac" 
                      className={`hover:text-purple-400 ${pathname === '/zodiac' ? 'text-purple-400' : ''}`}
                    >
                      {t('zodiac')}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/tarot" 
                      className={`hover:text-purple-400 ${pathname === '/tarot' ? 'text-purple-400' : ''}`}
                    >
                      {t('tarot')}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="https://bagibagi.co/akmalfy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-amber-500 hover:text-amber-400"
                    >
                      <Coffee size={20} />
                      {t('donate')}
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleSignOut}
                      className="text-white hover:text-purple-400"
                    >
                      {t('signOut')}
                    </button>
                  </li>
                </>
              )}

              {!user && !loading && (
                <li>
                  <Link href="/auth">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200">
                      {t('signIn')}
                    </button>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
        {children}
      </main>
      <footer className="bg-gray-800 py-4 text-center fixed bottom-0 w-full">
        <p>&copy; 2023 AFy Forecast. {t('footer')}</p>
      </footer>
    </div>
  )
}