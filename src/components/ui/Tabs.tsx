import { cn } from '@/lib/cn'

interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  tabs: { value: T; label: string }[]
}

export function Tabs<T extends string>({ value, onChange, tabs }: TabsProps<T>) {
  return (
    <div className="flex gap-1 rounded-xl bg-card p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
            value === tab.value
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-sub hover:text-text hover:bg-surface',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
