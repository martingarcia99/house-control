import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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
      where: {
        userId: user.id,
        householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0)

    const [currentMonthBills, lastMonthBills, allTimeBills] = await Promise.all([
      prisma.bill.findMany({
        where: {
          householdId,
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true },
      }),
      prisma.bill.findMany({
        where: {
          householdId,
          dueDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        include: { category: true },
      }),
      prisma.bill.findMany({
        where: {
          householdId,
        },
        include: { category: true },
      }),
    ])

    const allBillsTotal = allTimeBills.reduce((sum, b) => sum + b.amount, 0)

    const currentMonthTotal = currentMonthBills.reduce((sum, b) => sum + b.amount, 0)
    const lastMonthTotal = lastMonthBills.reduce((sum, b) => sum + b.amount, 0)

    const pendingBills = allTimeBills.filter((b) => b.status === 'PENDING')
    const pendingTotal = pendingBills.reduce((sum, b) => sum + b.amount, 0)

    const overdueBills = allTimeBills.filter((b) => b.status === 'OVERDUE')
    const overdueTotal = overdueBills.reduce((sum, b) => sum + b.amount, 0)

    const currentMonthByCategory = currentMonthBills
      .reduce((acc, b) => {
        const cat = b.category.name
        acc[cat] = (acc[cat] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const lastMonthByCategory = lastMonthBills
      .reduce((acc, b) => {
        const cat = b.category.name
        acc[cat] = (acc[cat] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const allByCategory = allTimeBills.reduce((acc, b) => {
      const cat = b.category.name
      acc[cat] = (acc[cat] || 0) + b.amount
      return acc
    }, {} as Record<string, number>)

    const categoryData = Object.entries(currentMonthByCategory).map(([name, amount]) => {
      const lastMonthAmount = lastMonthByCategory[name] || 0
      const change = lastMonthAmount > 0 ? ((amount - lastMonthAmount) / lastMonthAmount) * 100 : 0
      return {
        name,
        amount,
        change: Math.round(change * 10) / 10,
        color: currentMonthBills.find((b) => b.category.name === name)?.category.color || '#888',
      }
    })

    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1)
    
    const recentBills = allTimeBills.filter(b => b.dueDate >= sixMonthsAgo)
    
    const monthlyData = recentBills.reduce((acc, bill) => {
      const month = new Date(bill.dueDate).toLocaleString('default', { month: 'short' })
      acc[month] = (acc[month] || 0) + bill.amount
      return acc
    }, {} as Record<string, number>)

    const totalSpent = allTimeBills
      .reduce((sum, b) => sum + b.amount, 0)

    const averageMonthly = Object.values(monthlyData).length > 0
      ? totalSpent / Object.keys(monthlyData).length
      : 0

    const categoryDataAll = Object.entries(allByCategory).map(([name, amount]) => {
      const lastMonthAmount = lastMonthByCategory[name] || 0
      const currentMonthAmount = currentMonthByCategory[name] || 0
      const change = lastMonthAmount > 0 ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0
      return {
        name,
        amount,
        change: Math.round(change * 10) / 10,
        color: allTimeBills.find((b) => b.category.name === name)?.category.color || '#888',
      }
    })

    return NextResponse.json({
      summary: {
        currentMonthTotal: Math.round(allBillsTotal * 100) / 100,
        lastMonthTotal: Math.round(lastMonthTotal * 100) / 100,
        monthOverMonthChange: lastMonthTotal > 0
          ? Math.round(((allBillsTotal - lastMonthTotal) / lastMonthTotal) * 100 * 10) / 10
          : 0,
        pendingCount: pendingBills.length,
        pendingTotal: Math.round(pendingTotal * 100) / 100,
        overdueCount: overdueBills.length,
        overdueTotal: Math.round(overdueTotal * 100) / 100,
        totalSpent: Math.round(allBillsTotal * 100) / 100,
        averageMonthly: Math.round(averageMonthly * 100) / 100,
      },
      byCategory: categoryDataAll,
      monthlyTrend: Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount: Math.round(amount * 100) / 100,
      })),
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
