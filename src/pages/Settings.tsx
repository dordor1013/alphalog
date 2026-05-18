import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { LogOut, Save, Check, Plus, Trash2 } from 'lucide-react'
import type { TradeType } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'
import { cn } from '@/lib/cn'

export function SettingsPage() {
  const { strategies, updateStrategyName, addStrategy, deleteStrategy, user } = useStore()
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const buyStrategies = strategies.filter((s) => s.type === 'BUY').sort((a, b) => a.option_number - b.option_number)
  const sellStrategies = strategies.filter((s) => s.type === 'SELL').sort((a, b) => a.option_number - b.option_number)

  const startEdit = (id: string, currentName: string) => {
    setEditing((prev) => ({ ...prev, [id]: currentName }))
  }

  const handleSave = async (id: string) => {
    const name = editing[id]?.trim()
    if (!name) return

    await updateStrategyName(id, name)
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSaved((prev) => new Set(prev).add(id))
    setTimeout(() => setSaved((prev) => { const next = new Set(prev); next.delete(id); return next }), 1500)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const renderStrategyGroup = (label: string, type: TradeType, items: typeof strategies) => {
    const isBuy = type === 'BUY'
    const accentClass = isBuy ? 'text-buy' : 'text-sell'
    const borderClass = isBuy ? 'border-buy/20' : 'border-sell/20'

    return (
      <Card className="flex flex-1 flex-col gap-5">
        <h2 className={`text-sm font-semibold ${accentClass}`}>{label}</h2>
        <div className="flex flex-col gap-4">
          {items.map((s) => {
            const isEditing = s.id in editing
            return (
              <div key={s.id} className={`flex items-end gap-2 rounded-xl border ${borderClass} bg-bg p-3`}>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      label={`옵션 ${s.option_number}`}
                      value={editing[s.id]}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSave(s.id) }}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-text-dim">옵션 {s.option_number}</p>
                      <p className="mt-1 text-sm font-medium">{s.name}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <Button size="sm" onClick={() => handleSave(s.id)}>
                      <Save size={14} />
                    </Button>
                  ) : saved.has(s.id) ? (
                    <span className="flex h-8 items-center text-success"><Check size={16} /></span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(s.id, s.name)}>
                      편집
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteStrategy(s.id)} className="text-danger hover:text-danger">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => addStrategy(type)}
        >
          <Plus size={14} className="mr-1.5" /> 옵션 추가
        </Button>
      </Card>
    )
  }

  return (
    <div className={cn(PAGE_SHELL, 'lg:max-w-2xl')}>
      <h1 className="text-2xl font-bold tracking-tight">설정</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
        {renderStrategyGroup('매수 기준', 'BUY', buyStrategies)}
        {renderStrategyGroup('매도 기준', 'SELL', sellStrategies)}
      </div>

      <Card className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-text-sub">계정</h2>
        <p className="text-sm text-text-sub">{user?.email}</p>
        <Button variant="danger" onClick={handleLogout} className="w-full">
          <LogOut size={16} className="mr-2" />
          로그아웃
        </Button>
      </Card>
    </div>
  )
}
