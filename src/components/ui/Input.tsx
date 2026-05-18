import { cn } from '@/lib/cn'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-4">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-sub">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-[3rem] rounded-xl border border-border bg-surface px-5 py-3 text-sm font-normal leading-normal text-text',
            'placeholder:text-text-dim placeholder:text-sm placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50',
            'transition-all duration-200',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

Input.displayName = 'Input'
