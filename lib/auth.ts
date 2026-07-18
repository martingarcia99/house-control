import { cookies } from 'next/headers'
import { adminAuth } from './firebase/admin'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('auth-token')?.value

  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false)

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    return user
  } catch {
    return null
  }
}

export async function setAuthCookie(sessionCookie: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
