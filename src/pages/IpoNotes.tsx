import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Pencil, Rocket } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PAGE_SHELL } from '@/lib/pageLayout'
import { calcIpoProfit, calcIpoReturn, formatIpoReturnPct, formatKrw } from '@/lib/ipo'
import type { IpoFormData, IpoRecord } from '@/lib/types'
import { cn } from '@/lib/cn'

const emptyForm = (): IpoFormData => ({
  stock_name: '',
  underwriter: '',
  quantity: 0,
  allocation_price: 0,
  sell_date: format(new Date(), 'yyyy-MM-dd'),
  sell_price: 0,
})

function formFromRecord(r: IpoRecord): IpoFormData {
  return {
    stock_name: r.stock_name,
    underwriter: r.underwriter,
    quantity: r.quantity,
    allocation_price: Number(r.allocation_price),
    sell_date: r.sell_date ?? format(new Date(), 'yyyy-MM-dd'),
    sell_price: Number(r.sell_price ?? 0),
  }
}

export function IpoNotesPage() {
  const { ipoRecords, addIpoRecord, updateIpoRecord, deleteIpoRecord } = useStore()
  const [form, setForm] = useState<IpoFormData>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<IpoRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IpoRecord | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const previewReturn = useMemo(() => {
    if (form.allocation_price <= 0 || form.sell_price <= 0) return null
    return calcIpoReturn(form.allocation_price, form.sell_price)
  }, [form.allocation_price, form.sell_price])

  const previewProfit = useMemo(() => {
    if (form.allocation_price <= 0 || form.sell_price <= 0 || form.quantity <= 0) return null
    return calcIpoProfit(form.allocation_price, form.sell_price, form.quantity)
  }, [form.allocation_price, form.sell_price, form.quantity])

  const summary = useMemo(() => {
    let totalProfit = 0
    let returnSum = 0
    let returnCount = 0
    for (const r of ipoRecords) {
      const sell = Number(r.sell_price ?? 0)
      const alloc = Number(r.allocation_price)
      if (sell > 0 && alloc > 0) {
        totalProfit += calcIpoProfit(alloc, sell, r.quantity)
        returnSum += calcIpoReturn(alloc, sell) ?? 0
        returnCount += 1
      }
    }
    return {
      count: ipoRecords.length,
      totalProfit,
      avgReturn: returnCount > 0 ? Math.round((returnSum / returnCount) * 100) / 100 : null,
    }
  }, [ipoRecords])

  const validate = (data: IpoFormData): string | null => {
    if (!data.stock_name.trim()) return '종목명을 입력해 주세요.'
    if (!data.underwriter.trim()) return '주관사를 입력해 주세요.'
    if (data.quantity <= 0) return '수량(주)을 입력해 주세요.'
    if (data.allocation_price <= 0) return '배정가를 입력해 주세요.'
    if (!data.sell_date) return '매도일을 입력해 주세요.'
    if (data.sell_price <= 0) return '매도가를 입력해 주세요.'
    return null
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditTarget(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm(emptyForm())
    setEditTarget(null)
    setShowForm(true)
    setError('')
  }

  const openEdit = (r: IpoRecord) => {
    setForm(formFromRecord(r))
    setEditTarget(r)
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async () => {
    const msg = validate(form)
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    const ok = editTarget
      ? await updateIpoRecord(editTarget.id, form)
      : await addIpoRecord(form)
    setSaving(false)
    if (!ok) {
      setError('저장하지 못했습니다. DB 마이그레이션이 필요하면 npm run db:migrate 를 실행해 주세요.')
      return
    }
    resetForm()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteIpoRecord(deleteTarget.id)
    setDeleteTarget(null)
  }

  const renderRecordReturn = (r: IpoRecord) => {
    const sell = Number(r.sell_price ?? 0)
    const alloc = Number(r.allocation_price)
    if (sell <= 0 || alloc <= 0) return { pct: null as number | null, profit: null as number | null }
    return {
      pct: calcIpoReturn(alloc, sell),
      profit: calcIpoProfit(alloc, sell, r.quantity),
    }
  }

  return (
    <div className={cn(PAGE_SHELL, 'lg:max-w-2xl')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Rocket size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">공모주 노트</h1>
            <p className="text-sm text-text-sub">배정가 대비 매도 수익을 기록합니다</p>
          </div>
        </div>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} className="mr-1" />
            기록 추가
          </Button>
        )}
      </div>

      {ipoRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-text-sub">기록</p>
            <p className="mt-1 text-lg font-bold">{summary.count}건</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-text-sub">평균 수익률</p>
            <p
              className={cn(
                'mt-1 text-lg font-bold',
                summary.avgReturn !== null && summary.avgReturn > 0 && 'text-success',
                summary.avgReturn !== null && summary.avgReturn < 0 && 'text-danger',
              )}
            >
              {formatIpoReturnPct(summary.avgReturn)}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-text-sub">총 실현손익</p>
            <p
              className={cn(
                'mt-1 text-lg font-bold',
                summary.totalProfit > 0 && 'text-success',
                summary.totalProfit < 0 && 'text-danger',
              )}
            >
              {formatKrw(summary.totalProfit)}
            </p>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="flex flex-col gap-5 p-5">
          <h2 className="text-sm font-semibold text-text-sub">
            {editTarget ? '기록 수정' : '새 공모주 기록'}
          </h2>
          <Input
            label="종목명"
            placeholder="예: OO테크"
            value={form.stock_name}
            onChange={(e) => setForm((f) => ({ ...f, stock_name: e.target.value }))}
          />
          <Input
            label="주관사"
            placeholder="예: NH투자증권"
            value={form.underwriter}
            onChange={(e) => setForm((f) => ({ ...f, underwriter: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="수량 (주)"
              type="number"
              min="1"
              step="1"
              value={form.quantity || ''}
              onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 0 }))}
            />
            <Input
              label="배정가 (원)"
              type="number"
              min="0"
              step="1"
              placeholder="수익률 계산용"
              value={form.allocation_price || ''}
              onChange={(e) => setForm((f) => ({ ...f, allocation_price: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="매도일"
              type="date"
              value={form.sell_date}
              onChange={(e) => setForm((f) => ({ ...f, sell_date: e.target.value }))}
            />
            <Input
              label="매도가 (원)"
              type="number"
              min="0"
              step="1"
              value={form.sell_price || ''}
              onChange={(e) => setForm((f) => ({ ...f, sell_price: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="rounded-xl border border-border bg-bg px-4 py-3">
            <p className="text-xs text-text-sub">수익률 (자동 계산)</p>
            <p className="mt-1 text-xs text-text-dim">(매도가 − 배정가) ÷ 배정가 × 100</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span
                className={cn(
                  'text-2xl font-bold',
                  previewReturn !== null && previewReturn > 0 && 'text-success',
                  previewReturn !== null && previewReturn < 0 && 'text-danger',
                  previewReturn === null && 'text-text-dim',
                )}
              >
                {formatIpoReturnPct(previewReturn)}
              </span>
              {previewProfit !== null && (
                <span className="text-sm text-text-sub">
                  손익 {formatKrw(previewProfit)}
                </span>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={resetForm} disabled={saving}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>
      )}

      {ipoRecords.length === 0 && !showForm ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-text-sub">아직 공모주 기록이 없습니다.</p>
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1.5" />
            첫 기록 추가
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {ipoRecords.map((r) => {
            const { pct, profit } = renderRecordReturn(r)
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">{r.stock_name}</p>
                    <p className="mt-0.5 text-xs text-text-sub">{r.underwriter}</p>
                    <p className="mt-2 text-xs text-text-dim">
                      {r.quantity}주 · 배정 ₩{Number(r.allocation_price).toLocaleString('ko-KR')}
                      {r.sell_date && ` · 매도 ${r.sell_date}`}
                      {r.sell_price != null && ` · ₩${Number(r.sell_price).toLocaleString('ko-KR')}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-lg font-bold',
                        pct !== null && pct > 0 && 'text-success',
                        pct !== null && pct < 0 && 'text-danger',
                      )}
                    >
                      {formatIpoReturnPct(pct)}
                    </p>
                    {profit !== null && (
                      <p className="text-xs text-text-sub">{formatKrw(profit)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    <Pencil size={14} className="mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="기록 삭제">
        <p className="text-sm text-text-sub">
          <span className="font-medium text-text">{deleteTarget?.stock_name}</span> 기록을 삭제할까요?
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  )
}
