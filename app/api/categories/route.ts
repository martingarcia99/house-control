import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { categorySchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) {
      return NextResponse.json({ error: 'Hogar no especificado' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { householdId },
          { householdId: null, isDefault: true },
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error al obtener categorías:', error)
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
    const validatedData = categorySchema.parse(body)

    if (!validatedData.householdId) {
      return NextResponse.json({ error: 'Hogar no especificado' }, { status: 400 })
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: validatedData.householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        householdId: validatedData.householdId,
      },
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        icon: validatedData.icon,
        color: validatedData.color,
        householdId: validatedData.householdId,
      },
    })

    return NextResponse.json({ category })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
