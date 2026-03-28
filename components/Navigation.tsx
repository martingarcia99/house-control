'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon } from '@/components/ui'

const navItems = [
  { href: '/dashboard', icon: 'bar-chart', label: 'Inicio' },
  { href: '/bills', icon: 'file', label: 'Facturas' },
  { href: '/chat', icon: 'message', label: 'IA' },
  { href: '/profile', icon: 'settings', label: 'Perfil' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-around items-center h-14 md:h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon name={item.icon as 'bar-chart' | 'file' | 'message' | 'settings'} size={20} />
                <span className="text-[10px] md:text-xs mt-0.5 truncate max-w-[70px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
