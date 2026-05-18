import { cn } from '@/lib/cn'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

function SelectChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-4 w-4 shrink-0', className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.937a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-4">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-text-sub">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            /* appearance-none: OS 화살표 제거 → 좌우 인셋을 텍스트·아이콘에 동일하게 맞출 수 있음 */
            'min-h-[3rem] w-full appearance-none rounded-xl border border-border bg-surface py-3 pl-5 pr-12 text-sm font-normal leading-normal text-text',
            'focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50',
            'transition-all duration-200',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-text-sub"
          aria-hidden
        >
          <SelectChevronIcon />
        </span>
      </div>
    </div>
  )
}
