'use client'

import { useEffect } from 'react'
import { Icon } from '@/components/ui'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard segment error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <Icon name="alert" size={26} className="text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No se pudo cargar esta vista</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ha ocurrido un error. Puedes intentarlo de nuevo.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
