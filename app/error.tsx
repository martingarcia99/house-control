'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Algo salió mal</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
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
