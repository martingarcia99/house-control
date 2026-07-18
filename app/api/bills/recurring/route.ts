import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { recurringBillSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

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

    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id, householdId },
      select: { id: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const recurringBills = await prisma.recurringBill.findMany({
      where: { householdId },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recurringBills })
  } catch (error) {
    console.error('Error al obtener recurrentes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = recurringBillSchema.parse(body)

    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id, householdId: validatedData.householdId },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const recurringBill = await prisma.recurringBill.create({
      data: {
        amount: validatedData.amount,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        householdId: validatedData.householdId,
        createdById: user.id,
        dayOfMonth: validatedData.dayOfMonth,
        dueDay: validatedData.dueDay ?? null,
        active: validatedData.active ?? true,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json({ recurringBill })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 })
    }
    console.error('Error al crear recurrente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
