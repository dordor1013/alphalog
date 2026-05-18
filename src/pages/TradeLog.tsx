import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency, currencyUnit, type Market, type Trade, type TradeType } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'

export function TradeLogPage() {
  const location = useLocation()
  const defaultMarket: Market = location.pathname.includes('/us') ? 'US' : 'KR'
  const [market, setMarket] = useState<Market>(defaultMarket)
  const [filterType, setFilterType] = useState<TradeType | 'ALL'>('ALL')
  const [filterStock, setFilterStock] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null)

  const { getTradesByMarket, deleteTrade, strategies } = useStore()
  const trades = getTradesByMarket(market)

  const filtered = trades.filter((t) => {
    if (filterType !== 'ALL' && t.trade_type !== filterType) return false
    if (filterStock && !t.stock_name.toLowerCase().includes(filterStock.toLowerCase())) return false
    return true
  })

  const getStrategyName = (type: TradeType, optNum: number) => {
    const s = strategies.find((s) => s.type === type && s.option_number === optNum)
    return s?.name ?? `옵션 ${optNum}`
  }

  const totalAmount = (t: Trade) => t.trade_options.reduce((sum, o) => sum + o.amount, 0)

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteTrade(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className={PAGE_SHELL}>
      <h1 className="text-2xl font-bold tracking-tight">매매일지</h1>

      <Tabs
        value={market}
        onChange={setMarket}
        tabs={[
          { value: 'KR' as const, label: '국내주식 (KRW)' },
          { value: 'US' as const, label: '미국주식 (USD)' },
        ]}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="종목 검색..."
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TradeType | 'ALL')}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'BUY', label: '매수' },
            { value: 'SELL', label: '매도' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-text-sub">
          매매 기록이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
          {filtered.map((trade) => {
            const expanded = expandedId === trade.id
            const isBuy = trade.trade_type === 'BUY'

            return (
              <Card
                key={trade.id}
                className="cursor-pointer transition-all duration-200 hover:border-border-light"
                onClick={() => setExpandedId(expanded ? null : trade.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold">{trade.stock_name}</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                          isBuy
                            ? 'border-buy/25 bg-buy-bg text-buy'
                            : 'border-sell/25 bg-sell-bg text-sell'
                        }`}
                      >
                        {isBuy ? '매수' : '매도'}
                      </span>
                      <span className="text-xs text-text-dim">{currencyUnit(market)}</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-text-sub">
                      <span>{format(new Date(trade.trade_date), 'yyyy.MM.dd')}</span>
                      <span>{formatCurrency(totalAmount(trade), market)}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-text-sub">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="mb-3 flex flex-col gap-2">
                      {trade.trade_options.map((opt) => (
                        <div key={opt.id} className="flex items-center justify-between rounded-xl bg-bg p-3 text-sm">
                          <span className={isBuy ? 'text-buy/80' : 'text-sell/80'}>
                            {getStrategyName(trade.trade_type, opt.option_number)}
                          </span>
                          {opt.amount > 0 ? (
                            <div className="text-right text-text-sub">
                              <span>{formatCurrency(opt.price, market)} × {opt.quantity}주</span>
                              <span className="ml-2 font-semibold text-text">{formatCurrency(opt.amount, market)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-dim">선택 기준</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {trade.reason && (
                      <div className="mt-3 rounded-xl bg-bg p-3">
                        <p className="text-xs text-text-sub">매매이유</p>
                        <p className="mt-1.5 text-sm leading-relaxed">{trade.reason}</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(trade) }}
                      >
                        <Trash2 size={14} className="mr-1" /> 삭제
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="매매 기록 삭제"
      >
        <p className="text-sm text-text-sub leading-relaxed">
          <strong className="text-text">{deleteTarget?.stock_name}</strong> 매매 기록을 삭제하시겠습니까?
          <br />이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </div>
      </Modal>
    </div>
  )
}
