import { memo } from 'react'

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-12 mt-1" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export const BillsSkeleton = memo(function BillsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

export const Spinner = memo(function Spinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
})

export default Skeleton