import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'buy' | 'sell'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        {
          'bg-accent text-white hover:bg-accent-hover': variant === 'primary',
          'bg-surface text-text hover:bg-card-hover border border-border': variant === 'secondary',
          'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20': variant === 'danger',
          'bg-transparent text-text-sub hover:text-text hover:bg-card': variant === 'ghost',
          'bg-buy-bg text-buy border border-buy/20 hover:bg-buy-bg-hover': variant === 'buy',
          'bg-sell-bg text-sell border border-sell/20 hover:bg-sell-bg-hover': variant === 'sell',
        },
        {
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
