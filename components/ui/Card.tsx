import { clsx } from 'clsx'
import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white rounded-2xl shadow-sm shadow-gray-200/60 border border-gray-100/80 dark:bg-gray-900 dark:border-gray-800 dark:shadow-none',
      bordered: 'bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800',
      elevated: 'bg-white rounded-2xl shadow-lg shadow-gray-200/70 dark:bg-gray-900 dark:shadow-black/40',
    }

    return (
      <div ref={ref} className={clsx(variants[variant], className)} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('px-6 py-4 border-b border-gray-100 dark:border-gray-800', className)} {...props}>
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('px-6 py-4 border-t border-gray-100 dark:border-gray-800', className)} {...props}>
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'
