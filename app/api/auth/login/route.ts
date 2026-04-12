import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie, getCurrentUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, name: true, avatarUrl: true, password: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(validatedData.password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const token = generateToken({ userId: user.id, email: user.email })
    await setAuthCookie(token)

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
      household: householdMember ? {
        id: householdMember.household.id,
        name: householdMember.household.name,
        role: householdMember.role,
      } : null,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const householdMember = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      include: { household: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      user,
      household: householdMember ? {
        id: householdMember.household.id,
        name: householdMember.household.name,
        role: householdMember.role,
      } : null,
    })
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}