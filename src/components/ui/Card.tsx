import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card p-6 sm:p-7', className)}
      {...props}
    >
      {children}
    </div>
  )
}
