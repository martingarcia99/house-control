import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { visionCompletion } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = image.type || 'image/jpeg'

    const prompt = `Analiza esta imagen de una factura y extrae los siguientes datos en formato JSON:
{
  "amount": número (importe total de la factura),
  "description": string (descripción breve como "Factura de luz", "Internet", etc.),
  "dueDate": string (fecha de vencimiento en formato YYYY-MM-DD),
  "category": string (categoría más apropiada: Luz, Agua, Gas, Internet, Alquiler, Suscripciones, etc.)
}

Si no puedes extraer algún dato, usa null. La fecha debe ser en formato ISO YYYY-MM-DD.`

    const content = await visionCompletion(prompt, base64, mimeType)

    if (!content) {
      return NextResponse.json({ error: 'No se pudo analizar la factura' }, { status: 500 })
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Formato de respuesta inválido' }, { status: 500 })
    }

    const extractedData = JSON.parse(jsonMatch[0])

    return NextResponse.json({ 
      success: true,
      data: {
        amount: extractedData.amount || null,
        description: extractedData.description || '',
        dueDate: extractedData.dueDate || null,
        category: extractedData.category || null,
      }
    })

  } catch (error) {
    console.error('Error escaneando factura:', error)
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    )
  }
}
