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

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1)

    const [summaryStats, categoryData, monthlyTrend] = await Promise.all([
      prisma.$queryRaw<Array<{
        current_total: number
        last_total: number
        all_total: number
        pending_total: number
        pending_count: number
        overdue_total: number
        overdue_count: number
      }>>`
        SELECT 
          COALESCE(SUM(CASE WHEN "dueDate" >= ${startOfMonth} AND "dueDate" <= ${endOfMonth} THEN "amount" ELSE 0 END), 0) as current_total,
          COALESCE(SUM(CASE WHEN "dueDate" >= ${startOfLastMonth} AND "dueDate" <= ${endOfLastMonth} THEN "amount" ELSE 0 END), 0) as last_total,
          COALESCE(SUM("amount"), 0) as all_total,
          COALESCE(SUM(CASE WHEN "status" IN ('PENDING', 'OVERDUE') THEN "amount" ELSE 0 END), 0) as pending_total,
          COUNT(CASE WHEN "status" IN ('PENDING', 'OVERDUE') THEN 1 END) as pending_count,
          COALESCE(SUM(CASE WHEN "status" = 'OVERDUE' THEN "amount" ELSE 0 END), 0) as overdue_total,
          COUNT(CASE WHEN "status" = 'OVERDUE' THEN 1 END) as overdue_count
        FROM "Bill"
        WHERE "householdId" = ${householdId}
      `,
      prisma.$queryRaw<Array<{
        category_name: string
        category_color: string
        cat_total: number
      }>>`
        SELECT 
          c.name as category_name,
          COALESCE(c.color, '#888') as category_color,
          COALESCE(SUM(b."amount"), 0) as cat_total
        FROM "Bill" b
        JOIN "Category" c ON b."categoryId" = c.id
        WHERE b."householdId" = ${householdId}
        GROUP BY c.id
        ORDER BY cat_total DESC
      `,
      prisma.$queryRaw<Array<{ month: string; year: string; total: number }>>`
        SELECT 
          EXTRACT(MONTH FROM "dueDate")::text as month,
          EXTRACT(YEAR FROM "dueDate")::text as year,
          SUM("amount") as total
        FROM "Bill"
        WHERE "householdId" = ${householdId} AND "dueDate" >= ${sixMonthsAgo}
        GROUP BY EXTRACT(YEAR FROM "dueDate"), EXTRACT(MONTH FROM "dueDate")
        ORDER BY year, month
        LIMIT 6
      `,
    ])

    const stats = summaryStats[0]
    const currentMonthTotal = Number(stats?.current_total || 0)
    const lastTotal = Number(stats?.last_total || 0)
    const totalSpent = Number(stats?.all_total || 0)
    const pendingTotal = Number(stats?.pending_total || 0)
    const pendingCount = Number(stats?.pending_count || 0)
    const overdueTotal = Number(stats?.overdue_total || 0)
    const overdueCount = Number(stats?.overdue_count || 0)

    const byCategory = (categoryData || []).map((row) => ({
      name: row.category_name,
      amount: Number(row.cat_total),
      change: 0,
      color: row.category_color,
    }))

    const monthlyArray = (Array.isArray(monthlyTrend) ? monthlyTrend : []).map((row: { month: string; year: string; total: number }) => ({
      month: new Date(`${row.year || '2024'}-${row.month}-01`).toLocaleString('default', { month: 'short' }),
      amount: Number(row.total) || 0,
    }))

    const averageMonthly = monthlyArray.length > 0 ? totalSpent / monthlyArray.length : currentMonthTotal

    return NextResponse.json({
      summary: {
        currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
        lastMonthTotal: Math.round(lastTotal * 100) / 100,
        monthOverMonthChange: lastTotal > 0
          ? Math.round(((currentMonthTotal - lastTotal) / lastTotal) * 100 * 10) / 10
          : 0,
        pendingCount,
        pendingTotal: Math.round(pendingTotal * 100) / 100,
        overdueCount,
        overdueTotal: Math.round(overdueTotal * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        averageMonthly: Math.round(averageMonthly * 100) / 100,
      },
      byCategory,
      monthlyTrend: monthlyArray,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}