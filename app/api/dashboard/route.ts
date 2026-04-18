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
      select: { id: true },
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
    const startOfLastMonth = new Date(currentYear, currentMonth - 2, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59)
    const twoYearsAgo = new Date(currentYear - 2, currentMonth - 1, 1)

    const [summaryStats, categoryData, monthlyTrend] = await Promise.all([
      prisma.$queryRaw<Array<{
        current_total: number
        last_total: number
      }>>`
        SELECT 
          COALESCE(SUM(CASE WHEN b."issueDate" >= ${startOfMonth} AND b."issueDate" <= ${endOfMonth} THEN b."amount" ELSE 0 END), 0) as current_total,
          COALESCE(SUM(CASE WHEN b."issueDate" >= ${startOfLastMonth} AND b."issueDate" <= ${endOfLastMonth} THEN b."amount" ELSE 0 END), 0) as last_total
        FROM "Bill" b
        WHERE b."householdId" = ${householdId}
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
          AND b."issueDate" >= ${startOfMonth}
          AND b."issueDate" <= ${endOfMonth}
        GROUP BY c.id
        ORDER BY cat_total DESC
      `,
      prisma.$queryRaw<Array<{ month: string; year: string; total: number }>>`
        SELECT 
          EXTRACT(MONTH FROM "issueDate")::text as month,
          EXTRACT(YEAR FROM "issueDate")::text as year,
          SUM("amount") as total
        FROM "Bill"
        WHERE "householdId" = ${householdId}
          AND "issueDate" >= ${twoYearsAgo}
        GROUP BY EXTRACT(YEAR FROM "issueDate"), EXTRACT(MONTH FROM "issueDate")
        ORDER BY year, month
      `,
    ])

    const stats = summaryStats[0]
    const currentMonthTotal = Number(stats?.current_total || 0)
    const lastTotal = Number(stats?.last_total || 0)

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

    const allTimeTotal = monthlyArray.reduce((sum, m) => sum + m.amount, 0)
    const averageMonthly = monthlyArray.length > 0 ? allTimeTotal / monthlyArray.length : currentMonthTotal

    return NextResponse.json({
      summary: {
        currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
        lastMonthTotal: Math.round(lastTotal * 100) / 100,
        monthOverMonthChange: lastTotal > 0
          ? Math.round(((currentMonthTotal - lastTotal) / lastTotal) * 100 * 10) / 10
          : 0,
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