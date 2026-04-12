import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { chatCompletion } from '@/lib/ai'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    const formattedMessages = messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
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
    const { message, householdId } = body

    if (!message || !householdId) {
      return NextResponse.json(
        { error: 'Mensaje y hogar son requeridos' },
        { status: 400 }
      )
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: 'USER',
        content: message,
      },
    })

    const member = await prisma.householdMember.findFirst({
      where: {
        userId: user.id,
        householdId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'No perteneces a este hogar' }, { status: 403 })
    }

    const allBills = await prisma.bill.findMany({
      where: { householdId },
      include: { category: true },
      orderBy: { dueDate: 'desc' },
    })

    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0)

    const currentBills = allBills.filter(b => b.issueDate && b.issueDate >= startOfMonth && b.issueDate <= endOfMonth)
    const lastMonthBills = allBills.filter(b => b.issueDate && b.issueDate >= startOfLastMonth && b.issueDate <= endOfLastMonth)

    const currentTotal = currentBills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0)

    const lastMonthTotal = lastMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0)

    const currentByCategory = currentBills
      .filter((b) => b.status === 'PAID')
      .reduce((acc, b) => {
        acc[b.category.name] = (acc[b.category.name] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const lastByCategory = lastMonthBills
      .filter((b) => b.status === 'PAID')
      .reduce((acc, b) => {
        acc[b.category.name] = (acc[b.category.name] || 0) + b.amount
        return acc
      }, {} as Record<string, number>)

    const paidBills = allBills.filter(b => b.status === 'PAID' && b.issueDate)
    const totalSpent = paidBills.reduce((sum, b) => sum + b.amount, 0)
    const months = new Set(paidBills.map(b => `${b.issueDate!.getFullYear()}-${b.issueDate!.getMonth()}`)).size
    const avgMonthly = months > 0 ? totalSpent / months : 0

    const systemPrompt = `Eres un asistente financiero experto llamado "CasaControl AI". Tu trabajo es ayudar a los usuarios a entender sus gastos del hogar y ofrecerles consejos prácticos para ahorrar dinero.

Información del usuario:
- Gasto actual del mes: ${currentTotal.toFixed(2)}€
- Gasto del mes pasado: ${lastMonthTotal.toFixed(2)}€
- Gastos por categoría este mes: ${JSON.stringify(currentByCategory)}
- Gastos por categoría mes pasado: ${JSON.stringify(lastByCategory)}
- Promedio mensual (últimos 6 meses): ${avgMonthly.toFixed(2)}€

Instrucciones:
1. Responde siempre en español
2. Sé específico con los números y porcentajes cuando sea posible
3. Da consejos prácticos y accionables
4. Mantén un tono amigable pero profesional
5. Si el usuario pregunta sobre gastos futuros, usa el promedio mensual como referencia
6. Sugiere formas concretas de ahorrar según las categorías donde gasta más

Responde de manera concisa pero útil.`

    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
        .reverse()
        .map((m) => ({ role: m.role.toLowerCase(), content: m.content })),
      { role: 'user', content: message },
    ]

    const assistantResponse = await chatCompletion(conversationHistory) || 
      'Lo siento, no pude generar una respuesta en este momento.'

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: 'ASSISTANT',
        content: assistantResponse,
      },
    })

    return NextResponse.json({
      userMessage: { ...userMessage, createdAt: userMessage.createdAt.toISOString() },
      assistantMessage: { ...assistantMessage, createdAt: assistantMessage.createdAt.toISOString() },
    })
  } catch (error) {
    console.error('Error en chat con IA:', error)

    const user = await getCurrentUser()
    if (user) {
      const fallbackResponse = 'Lo siento, tuve un problema al procesar tu solicitud. Por favor, intenta de nuevo.'
      
      await prisma.chatMessage.create({
        data: {
          userId: user.id,
          role: 'ASSISTANT',
          content: fallbackResponse,
        },
      })

      return NextResponse.json({
        assistantMessage: { 
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: fallbackResponse,
          createdAt: new Date().toISOString(),
        },
      }, { status: 200 })
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
