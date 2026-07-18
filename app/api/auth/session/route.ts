import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase/admin'
import { setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const defaultCategories = [
  { name: 'Luz', icon: 'zap', color: '#f59e0b', isDefault: true },
  { name: 'Agua', icon: 'droplets', color: '#3b82f6', isDefault: true },
  { name: 'Gas', icon: 'flame', color: '#ef4444', isDefault: true },
  { name: 'Internet', icon: 'wifi', color: '#8b5cf6', isDefault: true },
  { name: 'Alquiler', icon: 'home', color: '#10b981', isDefault: true },
  { name: 'Alarma', icon: 'shield', color: '#f97316', isDefault: true },
  { name: 'Comunidad', icon: 'building', color: '#0ea5e9', isDefault: true },
  { name: 'Suscripciones', icon: 'credit-card', color: '#ec4899', isDefault: true },
]

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken es requerido' }, { status: 400 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })

    if (!user && decoded.email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email: { equals: decoded.email, mode: 'insensitive' } },
      })

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { firebaseUid: decoded.uid },
        })
      }
    }

    if (!user) {
      if (!decoded.email) {
        return NextResponse.json({ error: 'La cuenta de Google no tiene email' }, { status: 400 })
      }

      user = await prisma.user.create({
        data: {
          email: decoded.email,
          firebaseUid: decoded.uid,
          name: decoded.name || decoded.email.split('@')[0],
          avatarUrl: decoded.picture,
        },
      })

      const household = await prisma.household.create({
        data: {
          name: 'Mi Hogar',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      })

      await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          householdId: household.id,
        })),
      })
    }

    const expiresIn = 60 * 60 * 24 * 7 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    await setAuthCookie(sessionCookie)

    const householdMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: { household: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      household: householdMember
        ? {
            id: householdMember.household.id,
            name: householdMember.household.name,
            role: householdMember.role,
          }
        : null,
    })
  } catch (error) {
    console.error('Error en sesión de Firebase:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
