import { Spinner } from '@/components/ui/Skeleton'

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-950 dark:to-gray-900">
      <Spinner />
    </div>
  )
}
