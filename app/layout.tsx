import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'CasaControl - Gestiona tus facturas del hogar',
  description: 'Aplicación para gestionar facturas del hogar con IA',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} pb-16 md:pb-0`}>
        <Providers>
          <div className="min-h-screen pb-16">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
