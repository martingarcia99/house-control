'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, Button, Input, Modal } from '@/components/ui'
import { Icon } from '@/components/ui'

interface UserData {
  name: string
  email: string
}

export default function ProfilePage() {
  const { user, household, setUser, setHousehold } = useAppStore()
  const router = useRouter()
  const [showEditName, setShowEditName] = useState(false)
  const [showEditHousehold, setShowEditHousehold] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [householdName, setHouseholdName] = useState(household?.name || '')

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user!, name })
        setShowEditName(false)
      }
    } catch (error) {
      console.error('Error updating name:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateHousehold(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/households?householdId=${household?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: householdName }),
      })

      if (res.ok) {
        const data = await res.json()
        setHousehold({ ...household!, name: householdName })
        setShowEditHousehold(false)
      }
    } catch (error) {
      console.error('Error updating household:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setHousehold(null)
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Perfil</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-sm">Cuenta</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-sm">Nombre</p>
                <p className="text-xs text-gray-500">{user.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEditName(true)}>
                <Icon name="edit" size={14} />
              </Button>
            </div>
            <div className="py-2">
              <p className="font-medium text-sm">Email</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-sm">Hogar</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Nombre del hogar</p>
                <p className="text-xs text-gray-500">{household?.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEditHousehold(true)}>
                <Icon name="edit" size={14} />
              </Button>
            </div>
            <div className="py-2">
              <p className="font-medium text-sm">Tu rol</p>
              <p className="text-xs text-gray-500 capitalize">{household?.role?.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <Button 
              variant="secondary" 
              className="w-full justify-center"
              onClick={handleLogout}
            >
              <Icon name="logout" size={18} className="mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">CasaControl v1.0</p>
      </main>

      <Modal isOpen={showEditName} onClose={() => setShowEditName(false)} title="Editar nombre">
        <form onSubmit={handleUpdateName} className="space-y-4">
          <Input
            id="name"
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditName(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditHousehold} onClose={() => setShowEditHousehold(false)} title="Editar hogar">
        <form onSubmit={handleUpdateHousehold} className="space-y-4">
          <Input
            id="householdName"
            label="Nombre del hogar"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditHousehold(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
