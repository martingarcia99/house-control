import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { billSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!householdId) {
      return NextResponse.json({ error: 'Hogar no especificado' }, { status: 400 })
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const where: Record<string, unknown> = { householdId }

    if (status) {
      where.status = status
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      where.dueDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      select: {
        id: true,
        amount: true,
        description: true,
        dueDate: true,
        categoryId: true,
        householdId: true,
        paidById: true,
        status: true,
        attachmentUrl: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        paidBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json({ bills })
  } catch (error) {
    console.error('Error al obtener facturas:', error)
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
    const validatedData = billSchema.parse(body)

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: validatedData.householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const bill = await prisma.bill.create({
      data: {
        amount: validatedData.amount,
        description: validatedData.description,
        dueDate: validatedData.dueDate,
        categoryId: validatedData.categoryId,
        householdId: validatedData.householdId,
        paidById: user.id,
        status: validatedData.status || 'PENDING',
        attachmentUrl: validatedData.attachmentUrl,
        notes: validatedData.notes,
      },
      include: {
        category: true,
        paidBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    })

    if (bill.status === 'PAID') {
      await prisma.payment.create({
        data: {
          billId: bill.id,
          userId: user.id,
          amount: bill.amount,
        },
      })
    }

    return NextResponse.json({ bill })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error al crear factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
