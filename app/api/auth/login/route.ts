import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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