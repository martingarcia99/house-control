import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')

    if (!householdId) {
      return NextResponse.json({ error: 'Hogar no especificado' }, { status: 400 })
    }

    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id, householdId },
      select: { id: true, role: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const now = new Date()
    const selectedMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1
    const selectedYear = yearParam ? parseInt(yearParam) : now.getFullYear()

    const currentMonth = selectedMonth
    const currentYear = selectedYear
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth - 1 + 1, 0, 23, 59, 59)

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    })

    const totalMonthResult = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(b."amount"), 0) as total
      FROM "Bill" b
      WHERE b."householdId" = ${householdId}
        AND b."issueDate" >= ${startOfMonth}
        AND b."issueDate" <= ${endOfMonth}
        AND b."status" NOT IN ('CANCELLED')
    `
    const totalMonth = Number(totalMonthResult[0]?.total || 0)
    const memberCount = members.length
    const perMemberShare = memberCount > 0 ? totalMonth / memberCount : 0

    const memberStats = await Promise.all(
      members.map(async (m) => {
        const paymentsThisMonth = await prisma.$queryRaw<Array<{ total: number }>>`
          SELECT COALESCE(SUM(p."amount"), 0) as total
          FROM "Payment" p
          JOIN "Bill" b ON p."billId" = b.id
          WHERE b."householdId" = ${householdId}
            AND p."userId" = ${m.userId}
            AND b."issueDate" >= ${startOfMonth}
            AND b."issueDate" <= ${endOfMonth}
        `

        const totalPaid = Math.round(Number(paymentsThisMonth[0]?.total || 0) * 100) / 100
        const roundedFairShare = Math.round(perMemberShare * 100) / 100
        const isPaid = totalPaid >= roundedFairShare && roundedFairShare > 0

        return {
          userId: m.userId,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
          joinedAt: m.joinedAt,
          fairShare: roundedFairShare,
          totalPaid: Math.round(totalPaid * 100) / 100,
          pendingAmount: Math.round((roundedFairShare - totalPaid) * 100) / 100,
          isPaid: totalPaid >= roundedFairShare && roundedFairShare > 0,
        }
      })
    )

    return NextResponse.json({
      members: memberStats,
      summary: {
        totalBills: Math.round(totalMonth * 100) / 100,
        memberCount,
        perMember: Math.round(perMemberShare * 100) / 100,
      },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error al obtener miembros:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
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
    const { householdId, month, year } = body

    if (!householdId || month === undefined || !year) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id, householdId },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month - 1 + 1, 0, 23, 59, 59)

    const totalResult = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(b."amount"), 0) as total
      FROM "Bill" b
      WHERE b."householdId" = ${householdId}
        AND b."issueDate" >= ${startOfMonth}
        AND b."issueDate" <= ${endOfMonth}
        AND b."status" NOT IN ('CANCELLED')
    `
    const totalMonth = Number(totalResult[0]?.total || 0)

    const memberCountResult = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count
      FROM "HouseholdMember"
      WHERE "householdId" = ${householdId}
    `
    const memberCount = Number(memberCountResult[0]?.count || 1)
    const fairShare = totalMonth / memberCount

    const billsInMonth = await prisma.bill.findMany({
      where: {
        householdId,
        issueDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    })

    if (billsInMonth.length === 0) {
      return NextResponse.json({ success: true, message: 'No bills this month', amount: 0 })
    }

    for (const bill of billsInMonth) {
      const amountPerBill = fairShare / billsInMonth.length
      await prisma.payment.upsert({
        where: {
          billId_userId: { billId: bill.id, userId: user.id },
        },
        update: { amount: amountPerBill, date: new Date() },
        create: {
          billId: bill.id,
          userId: user.id,
          amount: amountPerBill,
        },
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      amount: Math.round(fairShare * 100) / 100,
      month,
      year 
    })
  } catch (error) {
    console.error('Error al pagar gastos:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    )
  }
}