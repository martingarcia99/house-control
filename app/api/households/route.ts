import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { householdSchema, joinHouseholdSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('id')

      if (householdId) {
      const household = await prisma.household.findUnique({
        where: { id: householdId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      })

      if (!household) {
        return NextResponse.json({ error: 'Hogar no encontrado' }, { status: 404 })
      }

      const member = household.members.find((m) => m.userId === user.id)
      if (!member) {
        return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
      }

      return NextResponse.json({ household })
    }

    const memberships = await prisma.householdMember.findMany({
      where: { userId: user.id },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    })

    const households = memberships.map((m) => ({
      ...m.household,
      role: m.role,
    }))

    return NextResponse.json({ households })
  } catch (error) {
    console.error('Error al obtener hogares:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = householdSchema.parse(body)

    const defaultCategories = [
      { name: 'Luz', icon: 'zap', color: '#f59e0b', isDefault: true },
      { name: 'Agua', icon: 'droplets', color: '#3b82f6', isDefault: true },
      { name: 'Gas', icon: 'flame', color: '#ef4444', isDefault: true },
      { name: 'Internet', icon: 'wifi', color: '#8b5cf6', isDefault: true },
      { name: 'Alquiler', icon: 'home', color: '#10b981', isDefault: true },
      { name: 'Alarma', icon: 'shield', color: '#f97316', isDefault: true },
      { name: 'Suscripciones', icon: 'credit-card', color: '#ec4899', isDefault: true },
    ]

    const household = await prisma.household.create({
      data: {
        name: validatedData.name,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
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

    return NextResponse.json({ household: { ...household, role: 'OWNER' } })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error al crear hogar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, inviteCode } = body

    if (action === 'join') {
      const validatedData = joinHouseholdSchema.parse({ inviteCode })

      const household = await prisma.household.findUnique({
        where: { inviteCode: validatedData.inviteCode },
      })

      if (!household) {
        return NextResponse.json({ error: 'Código de invitación inválido' }, { status: 404 })
      }

      const existingMember = await prisma.householdMember.findFirst({
        where: {
          userId: user.id,
          householdId: household.id,
        },
      })

      if (existingMember) {
        return NextResponse.json({ error: 'Ya eres miembro de este hogar' }, { status: 400 })
      }

      const member = await prisma.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'MEMBER',
        },
        include: {
          household: true,
        },
      })

      return NextResponse.json({ household: { ...member.household, role: member.role } })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error al unirse al hogar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
