'use client'

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setHousehold, user, household } = useAppStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  const checkAuth = useCallback(async () => {
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
  }, [setUser, setHousehold])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!loading && !checked) {
      setChecked(true)
      if (loading === false) {
        if (!user) {
          router.replace('/login')
        } else if (!household) {
          router.replace('/onboarding')
        }
      }
    }
  }, [loading, checked, user, household, router])

  if (!loading && !checked) {
    return <>{children}</>
  }

  return <>{children}</>
}