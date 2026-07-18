'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui'

const navItems = [
  { href: '/dashboard', icon: 'bar-chart', label: 'Inicio' },
  { href: '/bills', icon: 'file', label: 'Facturas' },
  { href: '/chat', icon: 'message', label: 'IA' },
  { href: '/profile', icon: 'settings', label: 'Perfil' },
]

export const Navigation = memo(function Navigation() {
  const pathname = usePathname()

  const items = useMemo(() => navItems.map(item => ({
    ...item,
    isActive: pathname === item.href,
  })), [pathname])

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-around items-center h-14 md:h-16">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                item.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className={`flex items-center justify-center h-7 w-11 rounded-full transition-colors ${
                item.isActive ? 'bg-primary-50 dark:bg-primary-900/40' : ''
              }`}>
                <Icon name={item.icon as 'bar-chart' | 'file' | 'message' | 'settings'} size={20} />
              </span>
              <span className="text-[10px] md:text-xs truncate max-w-[70px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
})
