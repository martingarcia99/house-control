'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setHousehold, user, household } = useAppStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/login', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          if (data.household) {
            setHousehold(data.household)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [setUser, setHousehold])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!household) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [loading, user, household, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
