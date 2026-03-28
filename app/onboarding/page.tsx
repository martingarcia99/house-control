'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Button, Input, Card, CardContent } from '@/components/ui'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">CasaControl</h1>
          <p className="text-gray-600">Configura tu hogar</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'create'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Crear hogar
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'join'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
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
