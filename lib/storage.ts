import { createClient, SupabaseClient } from '@supabase/supabase-js'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'bills'
const SIGNED_URL_TTL = 60 * 60 // 1 hora
const STORAGE_PREFIX = 'supabase:'

let client: SupabaseClient | null = null

export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })
  }
  return client
}

/**
 * Uploads a base64 data-URI attachment to Supabase Storage (private bucket)
 * and returns an internal reference ("supabase:<path>") to store in the DB —
 * never a real URL, since the bucket isn't public. The actual, time-limited
 * URL is minted on read via resolveAttachmentUrl/resolveAttachmentUrls.
 * If Supabase is not configured, returns the input unchanged (inline base64).
 */
export async function uploadAttachment(dataUri: string, householdId: string): Promise<string> {
  if (!dataUri.startsWith('data:') || !isStorageConfigured()) {
    return dataUri
  }

  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return dataUri

  const [, mimeType, base64] = match
  const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg'
  const path = `${householdId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await getClient().storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) {
    console.error('Error subiendo adjunto a Supabase:', error.message)
    return dataUri
  }

  return `${STORAGE_PREFIX}${path}`
}

/** Resuelve una referencia de adjunto guardada en BD a una URL firmada y caduca. */
export async function resolveAttachmentUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null
  if (!stored.startsWith(STORAGE_PREFIX)) return stored
  if (!isStorageConfigured()) return null

  const path = stored.slice(STORAGE_PREFIX.length)
  const { data, error } = await getClient().storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  if (error || !data) {
    console.error('Error firmando URL de adjunto:', error?.message)
    return null
  }
  return data.signedUrl
}

/** Versión por lotes para listados — una sola llamada a Supabase en vez de N. */
export async function resolveAttachmentUrls<T extends { attachmentUrl?: string | null }>(
  items: T[]
): Promise<T[]> {
  const paths = items
    .map((i) => i.attachmentUrl)
    .filter((u): u is string => Boolean(u && u.startsWith(STORAGE_PREFIX)))
    .map((u) => u.slice(STORAGE_PREFIX.length))

  if (paths.length === 0 || !isStorageConfigured()) return items

  const { data, error } = await getClient().storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  if (error || !data) {
    console.error('Error firmando URLs de adjuntos:', error?.message)
    return items
  }

  const signedByPath = new Map(data.map((d) => [d.path, d.signedUrl]))

  return items.map((item) => {
    if (!item.attachmentUrl?.startsWith(STORAGE_PREFIX)) return item
    const path = item.attachmentUrl.slice(STORAGE_PREFIX.length)
    return { ...item, attachmentUrl: signedByPath.get(path) ?? null }
  })
}
