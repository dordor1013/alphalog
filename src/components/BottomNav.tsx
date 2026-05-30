import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, PlusCircle, Rocket, Globe, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/trades/kr', icon: BookOpen, label: '매매일지' },
  { to: '/new', icon: PlusCircle, label: '기록' },
  { to: '/ipo', icon: Rocket, label: '공모주' },
  { to: '/economic', icon: Globe, label: '경제' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function Sidebar() {
  return (
    <aside className="hidden h-dvh w-[15.5rem] shrink-0 flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-sm lg:mr-5 lg:flex xl:mr-6">
      <div className="flex flex-1 flex-col pl-6 pr-4 pt-8 pb-6 sm:pl-7">
        <div className="mb-16 flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <img src="/images/logo.png" alt="AlphaLog" className="h-full w-full object-cover" />
          </div>
          <span className="text-base font-bold tracking-tight">AlphaLog</span>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl py-3 pl-3 pr-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-sub hover:bg-surface hover:text-text',
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-border pt-5 text-xs leading-relaxed text-text-dim pl-0.5">
          AlphaLog v1.0
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-3 backdrop-blur-md safe-area-bottom sm:px-4 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-all duration-200 rounded-lg',
                isActive ? 'text-accent' : 'text-text-sub hover:text-text',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
