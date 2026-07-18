'use client'

import { useToastStore } from '@/lib/toastStore'
import { Icon } from './Icon'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-white animate-[fadeIn_0.2s_ease-out] ${
            t.variant === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          <Icon
            name={t.variant === 'success' ? 'check' : t.variant === 'error' ? 'alert' : 'bell'}
            size={16}
            className="mt-0.5 flex-shrink-0"
          />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100 flex-shrink-0">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
