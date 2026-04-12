'use client'

import { useAppStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAppStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user) {
      router.push('/dashboard')
    }
  }, [mounted, user, router])

  if (!mounted || user) {
    return null
  }

  return (
    <>
      {children}
    </>
  )
}
