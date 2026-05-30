import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { format } from 'date-fns'
import { Settings } from 'lucide-react'
import { formatCurrency, currencySymbol, currencyUnit, type Market, type TradeType, type TradeFormData } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'
import { cn } from '@/lib/cn'

function buildTradeOptions(
  selected: Set<number>,
  price: number,
  quantity: number,
): TradeFormData['options'] {
  const nums = Array.from(selected).sort((a, b) => a - b)
  if (nums.length === 0) return []
  const [first, ...rest] = nums
  return [
    { option_number: first, price, quantity },
    ...rest.map((n) => ({ option_number: n, price: 0, quantity: 0 })),
  ]
}

export function NewTradePage() {
  const navigate = useNavigate()
  const { addTrade, strategies } = useStore()

  const [market, setMarket] = useState<Market>('KR')
  const [stockName, setStockName] = useState('')
  const [tradeType, setTradeType] = useState<TradeType>('BUY')
  const [tradeDate, setTradeDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [unitPrice, setUnitPrice] = useState('')
  const [shareQty, setShareQty] = useState('')
  const [reason, setReason] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const relevantStrategies = strategies
    .filter((s) => s.type === tradeType)
    .sort((a, b) => a.option_number - b.option_number)

  const isBuy = tradeType === 'BUY'

  const sym = currencySymbol(market)
  const unit = currencyUnit(market)

  const priceNum = parseFloat(unitPrice) || 0
  const qtyNum = parseInt(shareQty, 10) || 0
  const lineTotal = priceNum * qtyNum

  const toggleOption = (n: number) => {
    const next = new Set(selectedOptions)
    if (next.has(n)) next.delete(n)
    else next.add(n)
    setSelectedOptions(next)
  }

  const canSubmit =
    stockName.trim() &&
    selectedOptions.size > 0 &&
    priceNum > 0 &&
    qtyNum > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    const data: TradeFormData = {
      market,
      stock_name: stockName.trim(),
      trade_type: tradeType,
      trade_date: tradeDate,
      reason,
      options: buildTradeOptions(selectedOptions, priceNum, qtyNum),
    }

    await addTrade(data)
    setSubmitting(false)
    navigate(market === 'KR' ? '/trades/kr' : '/trades/us')
  }

  return (
    <div className={cn(PAGE_SHELL, 'lg:max-w-2xl')}>
      <h1 className="text-2xl font-bold tracking-tight">매매 기록</h1>

      <Card className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="시장"
            value={market}
            onChange={(e) => setMarket(e.target.value as Market)}
            options={[
              { value: 'KR', label: '국내주식 (KRW)' },
              { value: 'US', label: '미국주식 (USD)' },
            ]}
          />
          <Select
            label="매매구분"
            value={tradeType}
            onChange={(e) => { setTradeType(e.target.value as TradeType); setSelectedOptions(new Set()) }}
            options={[
              { value: 'BUY', label: '매수' },
              { value: 'SELL', label: '매도' },
            ]}
          />
        </div>

        <Input
          label="종목명"
          placeholder={market === 'KR' ? '예: 삼성전자' : '예: AAPL'}
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />

        <Input
          label="매매일자"
          type="date"
          value={tradeDate}
          onChange={(e) => setTradeDate(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-text-sub">매매 금액</p>
          <p className="text-xs font-normal leading-relaxed text-text-dim">
            단위: <span className="font-medium text-text-sub">{sym} · {unit}</span>
            {' '}(종목 시장에 맞게 {market === 'US' ? '달러' : '원화'}로 입력)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`1주당 가격 (${sym})`}
            type="number"
            placeholder="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            min="0"
            step={market === 'US' ? '0.01' : '1'}
          />
          <Input
            label="수량 (주)"
            type="number"
            placeholder="0"
            value={shareQty}
            onChange={(e) => setShareQty(e.target.value)}
            min="0"
            step="1"
          />
        </div>

        <div className="flex flex-col gap-5">
          <span className="text-xs font-medium text-text-sub">총 매매금액</span>
          <div
            className={cn(
              'flex min-h-[3rem] items-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-normal leading-normal',
              lineTotal > 0 && (isBuy ? 'font-semibold text-buy' : 'font-semibold text-sell'),
              lineTotal <= 0 && 'text-text-dim',
            )}
          >
            {lineTotal > 0 ? formatCurrency(lineTotal, market) : '가격과 수량을 입력하면 자동 계산됩니다'}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-6 p-6">
        <p className="text-xs font-medium text-text-sub">
          {isBuy ? '매수' : '매도'} 기준 선택
          <span className="ml-1.5 font-normal text-text-dim">(복수 선택 가능)</span>
        </p>
        <div className="flex flex-col gap-3">
          {relevantStrategies.map((strategy) => {
            const n = strategy.option_number
            const selected = selectedOptions.has(n)

            return (
              <button
                key={strategy.id}
                type="button"
                onClick={() => toggleOption(n)}
                className={cn(
                  'flex min-h-[3rem] w-full cursor-pointer items-center rounded-xl border px-5 py-3 text-left text-sm font-normal leading-normal transition-all duration-200',
                  selected
                    ? isBuy
                      ? 'border-buy/30 bg-buy-bg text-buy'
                      : 'border-sell/30 bg-sell-bg text-sell'
                    : 'border-border bg-card text-text-sub hover:bg-card-hover',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-all',
                      selected
                        ? isBuy
                          ? 'border-buy bg-buy text-white'
                          : 'border-sell bg-sell text-white'
                        : 'border-border-light',
                    )}
                  >
                    {selected && '✓'}
                  </span>
                  {strategy.name}
                </span>
              </button>
            )
          })}
        </div>

        {relevantStrategies.length === 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-sub">
              옵션이 없습니다. 설정에서 {isBuy ? '매수' : '매도'} 기준 옵션을 추가해주세요.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => navigate('/settings', { state: { focusType: tradeType } })}
            >
              <Settings size={14} className="mr-1.5" />
              설정에서 옵션 추가
            </Button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-6 p-6">
        <label className="text-xs font-medium text-text-sub">매매이유</label>
        <textarea
          className="w-full min-h-[120px] resize-y rounded-xl border border-border bg-surface px-5 py-3 text-sm font-normal leading-normal text-text placeholder:text-text-dim placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200"
          placeholder="매매 근거를 기록해보세요..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Card>

      <Button
        variant={isBuy ? 'buy' : 'sell'}
        size="lg"
        className="w-full text-base"
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '저장 중...' : `${isBuy ? '매수' : '매도'} 기록 저장`}
      </Button>
    </div>
  )
}
