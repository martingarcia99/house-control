import { Navigation } from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="min-h-screen pb-16">
        {children}
      </div>
      <Navigation />
    </>
  )
}
