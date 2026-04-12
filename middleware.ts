import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/bills') || 
                           pathname.startsWith('/chat') || 
                           pathname.startsWith('/profile') || 
                           pathname.startsWith('/onboarding') ||
                           pathname === '/dashboard' ||
                           pathname === '/bills' ||
                           pathname === '/chat' ||
                           pathname === '/profile' ||
                           pathname === '/onboarding'

  const hasSession = request.cookies.get('auth-token')

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bills/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
  ],
}
