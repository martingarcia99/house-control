'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase/client'
import { useAppStore } from '@/lib/store'
import { Icon, IconBadge } from '@/components/ui'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser, setHousehold } = useAppStore()

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)

    try {
      const credential = await signInWithPopup(auth, googleProvider)
      const idToken = await credential.user.getIdToken()

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      setUser(data.user)
      if (data.household) {
        setHousehold(data.household)
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-950 p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary-300/40 dark:bg-primary-800/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-primary-400/30 dark:bg-primary-700/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-primary-200/40 dark:bg-primary-900/20 blur-2xl" />

      <div className="relative w-full max-w-sm animate-[fadeIn_0.4s_ease-out]">
        {/* Brand */}
        <div className="text-center mb-8">
          <IconBadge name="home" size="lg" className="mx-auto mb-4 shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">CasaControl</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona las facturas de tu hogar, sin líos</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white dark:border-gray-800 shadow-xl shadow-gray-200/60 dark:shadow-black/40 p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bienvenido</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inicia sesión para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="group w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loading ? 'Conectando…' : 'Continuar con Google'}</span>
          </button>

          <p className="mt-5 text-center text-xs text-gray-400 leading-relaxed">
            Al continuar aceptas que gestionemos tus facturas y datos del hogar dentro de CasaControl.
          </p>
        </div>

        {/* Feature strip */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <Icon name="file" size={16} className="text-primary-600" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">Facturas<br />al día</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <Icon name="users" size={16} className="text-primary-600" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">Hogar<br />compartido</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <Icon name="sparkles" size={16} className="text-primary-600" />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">Insights<br />con IA</span>
          </div>
        </div>
      </div>
    </div>
  )
}
