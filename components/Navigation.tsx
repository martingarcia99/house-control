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
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-around items-center h-14 md:h-16">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                item.isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon name={item.icon as 'bar-chart' | 'file' | 'message' | 'settings'} size={20} />
              <span className="text-[10px] md:text-xs mt-0.5 truncate max-w-[70px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
})
