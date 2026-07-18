import { clsx } from 'clsx'
import { Icon } from './Icon'

type IconName = React.ComponentProps<typeof Icon>['name']

interface IconBadgeProps {
  name: IconName
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 16 },
  md: { box: 'h-10 w-10 rounded-xl', icon: 20 },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 30 },
}

export function IconBadge({ name, size = 'md', className }: IconBadgeProps) {
  const s = sizes[size]
  return (
    <div
      className={clsx(
        'flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm shadow-primary-500/30',
        s.box,
        className
      )}
    >
      <Icon name={name} size={s.icon} className="text-white" />
    </div>
  )
}
