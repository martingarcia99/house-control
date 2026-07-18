'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { useAppStore } from '@/lib/store'
import { toast } from '@/lib/toastStore'
import { Card, CardContent, CardHeader, Button, Input, Modal, IconBadge } from '@/components/ui'
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
        setUser({ ...user!, name })
        setShowEditName(false)
        toast.success('Nombre actualizado')
      } else {
        toast.error('No se pudo actualizar el nombre')
      }
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error('No se pudo actualizar el nombre')
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
        setHousehold({ ...household!, name: householdName })
        setShowEditHousehold(false)
        toast.success('Hogar actualizado')
      } else {
        toast.error('No se pudo actualizar el hogar')
      }
    } catch (error) {
      console.error('Error updating household:', error)
      toast.error('No se pudo actualizar el hogar')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await Promise.all([
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        }),
        signOut(auth),
      ])
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
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <IconBadge name="settings" size="sm" />
          <h1 className="text-lg font-bold text-gray-900">Perfil</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-500/30">
                <span className="text-white text-xl font-semibold">{user.name?.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowEditName(true)}>
              <Icon name="edit" size={14} />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Icon name="home" size={16} className="text-primary-600" />
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
