import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
    })

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

    const token = generateToken({ userId: user.id, email: user.email })
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      household: {
        id: household.id,
        name: household.name,
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
