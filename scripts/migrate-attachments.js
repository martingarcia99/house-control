// Migra los adjuntos guardados como base64 en Bill.attachmentUrl a Supabase Storage.
// Requiere SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (y opcionalmente SUPABASE_STORAGE_BUCKET) en .env.
// Uso: node scripts/migrate-attachments.js [--dry-run]

const fs = require('fs')
const path = require('path')

// Cargar .env (estos scripts no usan dotenv; Prisma solo carga DATABASE_URL)
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, '')
    }
  }
}

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const prisma = new PrismaClient()
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'bills'
const dryRun = process.argv.includes('--dry-run')

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env')
    process.exit(1)
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    realtime: {
      transport: WebSocket,
    },
  })

  const bills = await prisma.bill.findMany({
    where: { attachmentUrl: { startsWith: 'data:' } },
    select: { id: true, householdId: true, attachmentUrl: true },
  })

  console.log(`Facturas con adjunto base64: ${bills.length}${dryRun ? ' (dry-run, no se sube nada)' : ''}`)

  let ok = 0
  let failed = 0

  for (const bill of bills) {
    const match = bill.attachmentUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) {
      console.warn(`  ${bill.id}: formato data-URI no reconocido, se omite`)
      failed++
      continue
    }

    const [, mimeType, base64] = match
    const ext = (mimeType.split('/')[1] || 'jpg').split('+')[0]
    const storagePath = `${bill.householdId}/migrated-${bill.id}.${ext}`

    if (dryRun) {
      console.log(`  ${bill.id}: subiría ${(base64.length * 0.75 / 1024).toFixed(0)} KB → ${storagePath}`)
      ok++
      continue
    }

    const buffer = Buffer.from(base64, 'base64')
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    })

    if (error) {
      console.error(`  ${bill.id}: error subiendo — ${error.message}`)
      failed++
      continue
    }

    // El bucket es privado: se guarda solo la referencia interna, la URL real
    // se firma bajo demanda en cada petición (ver lib/storage.ts).
    const stored = `supabase:${storagePath}`
    await prisma.bill.update({
      where: { id: bill.id },
      data: { attachmentUrl: stored },
    })
    console.log(`  ${bill.id}: OK → ${stored}`)
    ok++
  }

  console.log(`\nHecho: ${ok} migradas, ${failed} con error.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
