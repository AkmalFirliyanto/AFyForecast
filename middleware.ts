import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

export async function middleware(request: NextRequest) {
  console.log('Middleware running for:', request.nextUrl.pathname)
  
  // Izinkan akses ke halaman login
  if (request.nextUrl.pathname === '/admin/login') {
    console.log('Mengizinkan akses ke halaman login')
    return NextResponse.next()
  }

  // Cek token untuk halaman admin lainnya
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('adminToken')?.value
    console.log('Checking token:', token ? 'exists' : 'not found')

    if (!token) {
      console.log('Token tidak ditemukan, redirect ke login')
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jose.jwtVerify(token, secret)
      console.log('Token valid, melanjutkan ke halaman admin')
      return NextResponse.next()
    } catch (error) {
      console.log('Token invalid:', error)
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 