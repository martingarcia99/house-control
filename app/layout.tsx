import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CasaControl - Gestiona tus facturas del hogar',
  description: 'Aplicación para gestionar facturas del hogar con IA',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} pb-16 md:pb-0`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
