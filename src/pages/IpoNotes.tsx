import { useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Rocket } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { PAGE_SHELL } from '@/lib/pageLayout'
import {
  calcIpoProfit,
  calcIpoReturn,
  formatIpoReturnPct,
  formatKrw,
  IPO_STATUS_LABELS,
  ipoRecordToForm,
  isIpoWon,
  validateIpoForm,
} from '@/lib/ipo'
import type { IpoAllotmentStatus, IpoFormData, IpoRecord } from '@/lib/types'
import { cn } from '@/lib/cn'

const emptyForm = (): IpoFormData => ({
  stock_name: '',
  underwriter: '',
  subscription_date: '',
  listing_date: '',
  allotment_status: 'PENDING',
  quantity: 0,
  allocation_price: 0,
  sell_date: '',
  sell_price: 0,
})

const STATUS_TABS: { value: IpoAllotmentStatus; label: string }[] = [
  { value: 'PENDING', label: '결과 대기' },
  { value: 'WON', label: '당첨' },
  { value: 'LOST', label: '미당첨' },
]

function StatusBadge({ status }: { status: IpoAllotmentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
        status === 'WON' && 'bg-success/15 text-success',
        status === 'LOST' && 'bg-text-dim/20 text-text-sub',
        status === 'PENDING' && 'bg-warning/15 text-warning',
      )}
    >
      {IPO_STATUS_LABELS[status]}
    </span>
  )
}

export function IpoNotesPage() {
  const { ipoRecords, addIpoRecord, updateIpoRecord, deleteIpoRecord } = useStore()
  const [form, setForm] = useState<IpoFormData>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<IpoRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IpoRecord | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const wonForm = isIpoWon(form.allotment_status)

  const previewReturn = useMemo(() => {
    if (!wonForm || form.allocation_price <= 0 || form.sell_price <= 0) return null
    return calcIpoReturn(form.allocation_price, form.sell_price)
  }, [wonForm, form.allocation_price, form.sell_price])

  const previewProfit = useMemo(() => {
    if (!wonForm || form.allocation_price <= 0 || form.sell_price <= 0 || form.quantity <= 0) return null
    return calcIpoProfit(form.allocation_price, form.sell_price, form.quantity)
  }, [wonForm, form.allocation_price, form.sell_price, form.quantity])

  const summary = useMemo(() => {
    let totalProfit = 0
    let returnSum = 0
    let returnCount = 0
    let won = 0
    let lost = 0
    let pending = 0

    for (const r of ipoRecords) {
      if (r.allotment_status === 'WON') won += 1
      else if (r.allotment_status === 'LOST') lost += 1
      else pending += 1

      if (r.allotment_status !== 'WON') continue
      const sell = Number(r.sell_price ?? 0)
      const alloc = Number(r.allocation_price ?? 0)
      if (sell > 0 && alloc > 0) {
        totalProfit += calcIpoProfit(alloc, sell, r.quantity)
        returnSum += calcIpoReturn(alloc, sell) ?? 0
        returnCount += 1
      }
    }

    return {
      count: ipoRecords.length,
      won,
      lost,
      pending,
      totalProfit,
      avgReturn: returnCount > 0 ? Math.round((returnSum / returnCount) * 100) / 100 : null,
    }
  }, [ipoRecords])

  const setStatus = (status: IpoAllotmentStatus) => {
    setForm((f) => ({
      ...f,
      allotment_status: status,
      ...(status !== 'WON'
        ? { quantity: 0, allocation_price: 0, sell_date: '', sell_price: 0 }
        : {}),
    }))
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
    setForm(ipoRecordToForm(r))
    setEditTarget(r)
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async () => {
    const msg = validateIpoForm(form)
    if (msg) {
      setError(msg)
      return
    }
    setSaving(true)
    const ok = editTarget ? await updateIpoRecord(editTarget.id, form) : await addIpoRecord(form)
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
    if (r.allotment_status === 'LOST') return { label: '미당첨', pct: null, profit: null }
    if (r.allotment_status === 'PENDING') return { label: '결과 대기', pct: null, profit: null }
    const sell = Number(r.sell_price ?? 0)
    const alloc = Number(r.allocation_price ?? 0)
    if (sell <= 0 || alloc <= 0) return { label: '매도 전', pct: null, profit: null }
    return {
      label: null,
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
            <p className="text-sm text-text-sub">청약 일정·당첨 결과·매도 수익을 기록합니다</p>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-3 text-center">
            <p className="text-xs text-text-sub">전체</p>
            <p className="mt-1 text-lg font-bold">{summary.count}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-text-sub">당첨</p>
            <p className="mt-1 text-lg font-bold text-success">{summary.won}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-text-sub">미당첨</p>
            <p className="mt-1 text-lg font-bold text-text-sub">{summary.lost}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-text-sub">당첨 평균 수익</p>
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
              label="청약일"
              type="date"
              value={form.subscription_date}
              onChange={(e) => setForm((f) => ({ ...f, subscription_date: e.target.value }))}
              required
            />
            <Input
              label="상장일 (선택)"
              type="date"
              value={form.listing_date}
              onChange={(e) => setForm((f) => ({ ...f, listing_date: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-text-sub">청약 결과</span>
            <Tabs value={form.allotment_status} onChange={setStatus} tabs={STATUS_TABS} />
            {form.allotment_status === 'LOST' && (
              <p className="text-xs text-text-dim leading-relaxed">
                미당첨 건은 일정만 저장됩니다. 배정·매도 정보는 입력하지 않습니다.
              </p>
            )}
            {form.allotment_status === 'PENDING' && (
              <p className="text-xs text-text-dim leading-relaxed">
                배정 발표 전입니다. 결과가 나오면 「당첨」 또는 「미당첨」으로 수정해 주세요.
              </p>
            )}
          </div>

          {wonForm && (
            <>
              <div className="rounded-xl border border-success/25 bg-success/5 px-4 py-3">
                <p className="text-xs font-medium text-success">당첨 — 배정·매도 정보</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="배정 수량 (주)"
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
                  value={form.allocation_price || ''}
                  onChange={(e) => setForm((f) => ({ ...f, allocation_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="매도일 (선택)"
                  type="date"
                  value={form.sell_date}
                  onChange={(e) => setForm((f) => ({ ...f, sell_date: e.target.value }))}
                />
                <Input
                  label="매도가 (원, 선택)"
                  type="number"
                  min="0"
                  step="1"
                  value={form.sell_price || ''}
                  onChange={(e) => setForm((f) => ({ ...f, sell_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <p className="text-xs text-text-dim -mt-2">
                매도 전이면 매도일·매도가를 비워 두세요. 입력하면 수익률이 계산됩니다.
              </p>

              {(previewReturn !== null || previewProfit !== null) && (
                <div className="rounded-xl border border-border bg-bg px-4 py-3">
                  <p className="text-xs text-text-sub">수익률 (자동 계산)</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span
                      className={cn(
                        'text-2xl font-bold',
                        previewReturn !== null && previewReturn > 0 && 'text-success',
                        previewReturn !== null && previewReturn < 0 && 'text-danger',
                      )}
                    >
                      {formatIpoReturnPct(previewReturn)}
                    </span>
                    {previewProfit !== null && (
                      <span className="text-sm text-text-sub">손익 {formatKrw(previewProfit)}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

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
            const ret = renderRecordReturn(r)
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">{r.stock_name}</p>
                      <StatusBadge status={r.allotment_status} />
                    </div>
                    <p className="mt-0.5 text-xs text-text-sub">{r.underwriter}</p>
                    <p className="mt-2 text-xs text-text-dim">
                      {r.subscription_date && `청약 ${r.subscription_date}`}
                      {r.listing_date && ` · 상장 ${r.listing_date}`}
                    </p>
                    {r.allotment_status === 'WON' && (
                      <p className="mt-1 text-xs text-text-dim">
                        {r.quantity}주
                        {r.allocation_price != null &&
                          ` · 배정 ₩${Number(r.allocation_price).toLocaleString('ko-KR')}`}
                        {r.sell_date && ` · 매도 ${r.sell_date}`}
                        {r.sell_price != null &&
                          ` · ₩${Number(r.sell_price).toLocaleString('ko-KR')}`}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {ret.label ? (
                      <p className="text-sm font-medium text-text-sub">{ret.label}</p>
                    ) : (
                      <>
                        <p
                          className={cn(
                            'text-lg font-bold',
                            ret.pct !== null && ret.pct > 0 && 'text-success',
                            ret.pct !== null && ret.pct < 0 && 'text-danger',
                          )}
                        >
                          {formatIpoReturnPct(ret.pct)}
                        </p>
                        {ret.profit !== null && (
                          <p className="text-xs text-text-sub">{formatKrw(ret.profit)}</p>
                        )}
                      </>
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
