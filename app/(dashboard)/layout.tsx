import { Navigation } from '@/components/Navigation'
import { Providers } from '@/app/providers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-screen pb-16">
        {children}
      </div>
      <Navigation />
    </Providers>
  )
}
