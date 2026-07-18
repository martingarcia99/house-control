'use client'

import { clsx } from 'clsx'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const sizes = {
    sm: 'max-w-[90%] sm:max-w-md',
    md: 'max-w-[90%] sm:max-w-lg',
    lg: 'max-w-[90%] sm:max-w-2xl',
    xl: 'max-w-[90%] sm:max-w-4xl',
  }

  return (
    <Fragment>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-2">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity animate-[fadeIn_0.15s_ease-out]"
            onClick={onClose}
          />
          <div
            className={clsx(
              'relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-black/40 transform transition-all animate-[fadeIn_0.2s_ease-out]',
              sizes[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
            <div className="px-4 py-3">{children}</div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
