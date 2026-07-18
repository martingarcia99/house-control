import { Spinner } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto h-7" />
      </header>
      <Spinner />
    </div>
  )
}
