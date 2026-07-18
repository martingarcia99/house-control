import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { billSchema } from '@/lib/validations'
import { resolveAttachmentUrl, uploadAttachment } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        category: true,
        paidBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
        payments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: bill.householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No tienes acceso a esta factura' }, { status: 403 })
    }

    return NextResponse.json({ bill: { ...bill, attachmentUrl: await resolveAttachmentUrl(bill.attachmentUrl) } })
  } catch (error) {
    console.error('Error al obtener factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const bill = await prisma.bill.findUnique({
      where: { id },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: bill.householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No tienes acceso a esta factura' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = billSchema.partial().parse(body)

    const updateData: Record<string, unknown> = { ...validatedData }
    if (validatedData.issueDate) {
      updateData.issueDate = new Date(validatedData.issueDate)
    }
    if ('dueDate' in validatedData) {
      updateData.dueDate = validatedData.dueDate ? new Date(`${validatedData.dueDate}T23:59:59`) : null
    }
    if (validatedData.attachmentUrl) {
      updateData.attachmentUrl = await uploadAttachment(validatedData.attachmentUrl, bill.householdId)
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        paidBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      bill: { ...updatedBill, attachmentUrl: await resolveAttachmentUrl(updatedBill.attachmentUrl) },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }
    console.error('Error al actualizar factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const bill = await prisma.bill.findUnique({
      where: { id },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId: bill.householdId,
      },
    })

    if (!member || member.role === 'MEMBER') {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta factura' }, { status: 403 })
    }

    await prisma.bill.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
