import { BillsSkeleton } from '@/components/ui/Skeleton'

export default function BillsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-4 pb-3">
        <div className="max-w-4xl mx-auto h-7" />
      </header>
      <main className="max-w-4xl mx-auto px-2 md:px-4 py-4">
        <BillsSkeleton />
      </main>
    </div>
  )
}
