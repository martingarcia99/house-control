'use client'

import { ReactNode, useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetchWithCache } from '@/lib/hooks/useFetchWithCache'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: ReactNode }) {
  const { setUser, setHousehold, user, household } = useAppStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)
  const fetchingRef = useRef(false)
  const { fetchWithCache, getCachedData } = useFetchWithCache()

  const checkAuth = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    const cachedUser = getCachedData<{ user: typeof user; household: typeof household }>('auth-current')

    if (cachedUser?.user) {
      setUser(cachedUser.user)
      if (cachedUser.household) {
        setHousehold(cachedUser.household)
      }
      setLoading(false)
      fetchingRef.current = false
      return
    }

    try {
      const res = await fetchWithCache<{ user: typeof user; household: typeof household }>(
        '/api/auth/login',
        { staleTime: 60000 }
      )

      if (res?.user) {
        setUser(res.user)
        if (res.household) {
          setHousehold(res.household)
        }
      }
    } catch (error) {
      const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined
      if (status !== 401) {
        console.error('Auth check failed:', error)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [setUser, setHousehold, fetchWithCache, getCachedData])

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