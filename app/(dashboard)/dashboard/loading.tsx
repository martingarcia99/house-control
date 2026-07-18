import { DashboardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="max-w-6xl mx-auto h-11" />
      </header>
      <main className="max-w-6xl mx-auto px-2 md:px-4 py-3">
        <DashboardSkeleton />
      </main>
    </div>
  )
}
