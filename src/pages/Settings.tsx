import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { exportAll, importAll } from '@/lib/localdb'
import { Save, Check, Plus, Trash2, Download, Upload, Copy } from 'lucide-react'
import type { TradeType } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'
import { cn } from '@/lib/cn'

function BackupCard() {
  const { loadAll } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const notify = (type: 'ok' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleExport = async () => {
    try {
      const bundle = await exportAll()
      const json = JSON.stringify(bundle, null, 2)
      const stamp = new Date().toISOString().slice(0, 10)
      const filename = `alphalog-backup-${stamp}.json`

      const file = new File([json], filename, { type: 'application/json' })
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: 'AlphaLog 백업' })
        return
      }

      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      notify('ok', '백업 파일을 저장했습니다.')
    } catch {
      notify('error', '내보내기에 실패했습니다. 아래 "복사"로 백업해 주세요.')
    }
  }

  const handleCopy = async () => {
    try {
      const bundle = await exportAll()
      await navigator.clipboard.writeText(JSON.stringify(bundle))
      notify('ok', '백업 데이터를 클립보드에 복사했습니다.')
    } catch {
      notify('error', '복사에 실패했습니다.')
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      await importAll(parsed)
      await loadAll()
      notify('ok', '백업을 불러왔습니다.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : '가져오기에 실패했습니다.')
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-text-sub">데이터 백업</h2>
        <p className="mt-1 text-xs text-text-dim leading-relaxed">
          모든 데이터는 이 기기에만 저장됩니다. 기기 변경·앱 삭제에 대비해 주기적으로 백업하세요.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={handleExport}>
          <Download size={16} className="mr-2" />
          내보내기
        </Button>
        <Button variant="secondary" className="flex-1" onClick={handleCopy}>
          <Copy size={16} className="mr-2" />
          복사
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} className="mr-2" />
          가져오기
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />

      <p className="text-xs text-text-dim leading-relaxed">
        가져오기를 하면 현재 데이터가 백업 파일 내용으로 <span className="text-danger">덮어쓰기</span> 됩니다.
      </p>

      {message && (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            message.type === 'ok' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
          )}
          role="alert"
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}

export function SettingsPage() {
  const location = useLocation()
  const focusType = (location.state as { focusType?: TradeType } | null)?.focusType
  const { strategies, updateStrategyName, addStrategy, deleteStrategy, initStrategies } = useStore()
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [addingType, setAddingType] = useState<TradeType | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    initStrategies()
  }, [initStrategies])

  useEffect(() => {
    if (!focusType) return
    document.getElementById(`strategy-group-${focusType}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [focusType])

  const handleAddStrategy = async (type: TradeType) => {
    setAddError(null)
    setAddingType(type)
    const ok = await addStrategy(type)
    setAddingType(null)
    if (!ok) {
      setAddError('옵션을 추가하지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

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

  const renderStrategyGroup = (label: string, type: TradeType, items: typeof strategies) => {
    const isBuy = type === 'BUY'
    const accentClass = isBuy ? 'text-buy' : 'text-sell'
    const borderClass = isBuy ? 'border-buy/20' : 'border-sell/20'

    return (
      <Card id={`strategy-group-${type}`} className="flex flex-1 flex-col gap-5 scroll-mt-6">
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
          disabled={addingType === type}
          onClick={() => handleAddStrategy(type)}
        >
          <Plus size={14} className="mr-1.5" />
          {addingType === type ? '추가 중...' : '옵션 추가'}
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

      {addError && (
        <p className="text-sm text-danger" role="alert">{addError}</p>
      )}

      <BackupCard />
    </div>
  )
}
