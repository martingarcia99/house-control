'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button, Input, Card, CardContent, IconBadge } from '@/components/ui'

export default function OnboardingPage() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setHousehold } = useAppStore()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear hogar')
        return
      }

      setHousehold({ ...data.household, role: data.household.role })
      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/households', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'join', inviteCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al unirse al hogar')
        return
      }

      setHousehold({ ...data.household, role: data.household.role })
      router.push('/dashboard')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-400/30 blur-3xl" />

      <div className="relative w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <div className="text-center mb-8">
          <IconBadge name="home" size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Configura tu hogar</h1>
          <p className="text-gray-500 text-sm">Crea uno nuevo o únete con un código de invitación</p>
        </div>

        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'create'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Crear hogar
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'join'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unirse a hogar
          </button>
        </div>

        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Crear nuevo hogar</h2>
                <Input
                  id="name"
                  label="Nombre del hogar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Casa"
                  required
                />
                <Button type="submit" className="w-full" isLoading={loading}>
                  Crear hogar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Unirse a un hogar</h2>
                <Input
                  id="inviteCode"
                  label="Código de invitación"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código de 6 caracteres"
                  required
                />
                <Button type="submit" className="w-full" isLoading={loading}>
                  Unirse
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
