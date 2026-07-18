import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { recurringBillSchema } from '@/lib/validations'

async function authorize(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

  const recurringBill = await prisma.recurringBill.findUnique({ where: { id } })
  if (!recurringBill) {
    return { error: NextResponse.json({ error: 'Recurrente no encontrada' }, { status: 404 }) }
  }

  const member = await prisma.householdMember.findFirst({
    where: { userId: user.id, householdId: recurringBill.householdId },
  })
  if (!member) {
    return { error: NextResponse.json({ error: 'No tienes acceso a esta recurrente' }, { status: 403 }) }
  }

  return { user, recurringBill }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const auth = await authorize(id)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const validatedData = recurringBillSchema.partial().parse(body)

    const updated = await prisma.recurringBill.update({
      where: { id },
      data: {
        amount: validatedData.amount,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        dayOfMonth: validatedData.dayOfMonth,
        dueDay: validatedData.dueDay,
        active: validatedData.active,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json({ recurringBill: updated })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 })
    }
    console.error('Error al actualizar recurrente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const auth = await authorize(id)
    if ('error' in auth) return auth.error

    await prisma.recurringBill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar recurrente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
