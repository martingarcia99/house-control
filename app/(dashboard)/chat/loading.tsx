import { Spinner } from '@/components/ui/Skeleton'

export default function ChatLoading() {
  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto h-8" />
      </header>
      <Spinner />
    </div>
  )
}
