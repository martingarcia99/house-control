import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { InsightType } from '@prisma/client'

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

    const startTwoMonthsAgo = new Date(currentYear, currentMonth - 2, 1)

    const [currentMonthBills, lastMonthBills, twoMonthsAgoBills] = await Promise.all([
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
          dueDate: { gte: startTwoMonthsAgo, lte: endOfLastMonth },
        },
        include: { category: true },
      }),
    ])

    const currentTotal = currentMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0)

    const lastTotal = lastMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0)

    const currentByCategory = currentMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((acc, b) => {
        const cat = b.category.name
        acc[cat] = (acc[cat] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const lastByCategory = lastMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((acc, b) => {
        const cat = b.category.name
        acc[cat] = (acc[cat] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const twoMonthsAgoByCategory = twoMonthsAgoBills
      .filter((b) => b.status === 'PAID')
      .reduce((acc, b) => {
        const cat = b.category.name
        acc[cat] = (acc[cat] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const insights = []
    const threshold = 20

    for (const [category, amount] of Object.entries(currentByCategory)) {
      const lastAmount = lastByCategory[category] || 0
      const twoMonthsAgoAmount = twoMonthsAgoByCategory[category] || 0

      if (lastAmount > 0) {
        const change = ((amount - lastAmount) / lastAmount) * 100
        if (change > threshold) {
          insights.push({
            type: 'ANOMALY',
            title: `Aumento en ${category}`,
            content: `Tu gasto en ${category} ha subido un ${Math.round(change)}% respecto al mes pasado.`,
            category,
            metadata: { change: Math.round(change), current: amount, last: lastAmount },
          })
        } else if (change < -threshold) {
          insights.push({
            type: 'TIP',
            title: `Reducción en ${category}`,
            content: `Has reducido tu gasto en ${category} un ${Math.round(Math.abs(change))}% respecto al mes pasado. ¡Bien hecho!`,
            category,
            metadata: { change: Math.round(change), current: amount, last: lastAmount },
          })
        }
      }

      if (twoMonthsAgoAmount > 0 && lastAmount > 0) {
        const trend = (amount - twoMonthsAgoAmount) / twoMonthsAgoAmount
        if (trend > 0.3) {
          insights.push({
            type: 'PATTERN',
            title: `Tendencia al alza en ${category}`,
            content: `Llevas dos meses aumentando el gasto en ${category}. Considera analizar por qué.`,
            category,
            metadata: { trend: Math.round(trend * 100) },
          })
        }
      }
    }

    if (currentTotal > lastTotal && lastTotal > 0) {
      const overallChange = ((currentTotal - lastTotal) / lastTotal) * 100
      if (overallChange > 15) {
        insights.push({
          type: 'RECOMMENDATION',
          title: 'Gastos totales en aumento',
          content: `Tu gasto total este mes es un ${Math.round(overallChange)}% mayor que el mes pasado. Revisa tus facturas pendientes.`,
          metadata: { change: Math.round(overallChange), current: currentTotal, last: lastTotal },
        })
      }
    }

    if (currentTotal > 0) {
      const subscriptions = currentByCategory['Suscripciones'] || 0
      if (subscriptions > currentTotal * 0.15) {
        insights.push({
          type: 'TIP',
          title: 'Revisa tus suscripciones',
          content: 'El gasto en suscripciones representa más del 15% de tus gastos. ¿Todas son necesarias?',
          category: 'Suscripciones',
        })
      }
    }

    const allBills = await prisma.bill.findMany({
      where: { householdId, status: 'PAID' },
      orderBy: { dueDate: 'asc' },
    })

    if (allBills.length >= 3) {
      const paidBills = allBills.filter((b) => b.status === 'PAID')
      const avgMonthly = paidBills.reduce((sum, b) => sum + b.amount, 0) / paidBills.length
      
      const nextMonthEstimate = avgMonthly * 1.1
      insights.push({
        type: 'PREDICTION',
        title: 'Predicción del próximo mes',
        content: `Basado en tu historial, estima que gastarás aproximadamente ${Math.round(nextMonthEstimate)}€ el próximo mes.`,
        metadata: { estimate: Math.round(nextMonthEstimate), average: Math.round(avgMonthly) },
      })
    }

    const savedInsights = await prisma.aIInsight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (savedInsights.length === 0 && insights.length > 0) {
      for (const insight of insights.slice(0, 5)) {
        await prisma.aIInsight.create({
          data: {
            userId: user.id,
            type: insight.type as InsightType,
            title: insight.title,
            content: insight.content,
            category: insight.category,
            metadata: insight.metadata,
          },
        })
      }
    }

    return NextResponse.json({
      insights,
      savedInsights,
    })
  } catch (error) {
    console.error('Error al obtener insights de IA:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
