import { useMemo, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, BarChart3, Wallet, Percent } from 'lucide-react'
import { formatCurrency, type Market } from '@/lib/types'
import {
  computeAllPeriodReturns,
  filterTradesByMarket,
  formatReturnPct,
  formatSignedPnL,
  type ReturnPeriod,
} from '@/lib/returns'
import { PAGE_SHELL } from '@/lib/pageLayout'
import { cn } from '@/lib/cn'

const COLORS = ['#2962FF', '#F23645', '#0ECB81', '#F0B90B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899']

export function DashboardPage() {
  const [market, setMarket] = useState<Market | 'ALL'>('ALL')
  const [returnPeriod, setReturnPeriod] = useState<ReturnPeriod>('month')
  const { trades, getHoldings } = useStore()

  const filteredTrades = useMemo(() => filterTradesByMarket(trades, market), [trades, market])
  const periodReturns = useMemo(() => computeAllPeriodReturns(filteredTrades), [filteredTrades])
  const krPeriodReturns = useMemo(
    () => computeAllPeriodReturns(filterTradesByMarket(trades, 'KR')),
    [trades],
  )
  const usPeriodReturns = useMemo(
    () => computeAllPeriodReturns(filterTradesByMarket(trades, 'US')),
    [trades],
  )
  const activeReturn = periodReturns.find((r) => r.period === returnPeriod) ?? periodReturns[2]
  const activeKr = krPeriodReturns.find((r) => r.period === returnPeriod)
  const activeUs = usPeriodReturns.find((r) => r.period === returnPeriod)

  const holdings = market === 'ALL' ? getHoldings() : getHoldings(market)
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  const pnlMarket: Market = market === 'ALL' ? 'KR' : market

  const pieData = holdings.map((h) => ({
    name: h.stock_name,
    value: h.value,
    quantity: h.quantity,
    avg_price: h.avg_price,
    market: h.market,
  }))

  const totalTrades = trades.length
  const stockCount = holdings.length

  return (
    <div className={PAGE_SHELL}>
      <h1 className="text-2xl font-bold tracking-tight">포트폴리오</h1>

      <Tabs
        value={market}
        onChange={setMarket}
        tabs={[
          { value: 'ALL' as const, label: '전체' },
          { value: 'KR' as const, label: '국내 (KRW)' },
          { value: 'US' as const, label: '미국 (USD)' },
        ]}
      />

      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
              <Percent size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-sub">누적 수익률</h2>
              <p className="text-xs text-text-dim">기간 내 실현손익 ÷ 매수금액 (매도·매수 기록 기준)</p>
            </div>
          </div>
        </div>

        <Tabs
          value={returnPeriod}
          onChange={setReturnPeriod}
          tabs={[
            { value: 'day' as const, label: '일' },
            { value: 'week' as const, label: '주' },
            { value: 'month' as const, label: '월' },
            { value: 'year' as const, label: '년' },
          ]}
        />

        {market === 'ALL' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: '국내 (KRW)', data: activeKr, m: 'KR' as const },
              { label: '미국 (USD)', data: activeUs, m: 'US' as const },
            ].map(({ label, data, m }) => (
              <div key={m} className="flex flex-col gap-1 rounded-xl border border-border bg-bg px-5 py-4">
                <span className="text-xs text-text-sub">
                  {label} · {data?.label ?? activeReturn.label} 누적
                </span>
                <span
                  className={cn(
                    'text-2xl font-bold tracking-tight',
                    data?.returnPct === null && 'text-text-dim',
                    data && data.returnPct !== null && data.returnPct > 0 && 'text-success',
                    data && data.returnPct !== null && data.returnPct < 0 && 'text-danger',
                  )}
                >
                  {formatReturnPct(data?.returnPct ?? null)}
                </span>
                {data?.hasTrades && data.returnPct !== null ? (
                  <p className="text-sm text-text-sub">
                    실현손익{' '}
                    <span
                      className={cn(
                        'font-medium',
                        data.pnl > 0 && 'text-success',
                        data.pnl < 0 && 'text-danger',
                      )}
                    >
                      {formatSignedPnL(data.pnl, m)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-text-dim">이 기간 매매 없음</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-bg px-5 py-4">
            <span className="text-xs text-text-sub">{activeReturn.label} 누적</span>
            <span
              className={cn(
                'text-3xl font-bold tracking-tight',
                activeReturn.returnPct === null && 'text-text-dim',
                activeReturn.returnPct !== null && activeReturn.returnPct > 0 && 'text-success',
                activeReturn.returnPct !== null && activeReturn.returnPct < 0 && 'text-danger',
                activeReturn.returnPct === 0 && 'text-text',
              )}
            >
              {formatReturnPct(activeReturn.returnPct)}
            </span>
            {activeReturn.hasTrades && activeReturn.returnPct !== null ? (
              <p className="text-sm text-text-sub">
                실현손익{' '}
                <span
                  className={cn(
                    'font-medium',
                    activeReturn.pnl > 0 && 'text-success',
                    activeReturn.pnl < 0 && 'text-danger',
                  )}
                >
                  {formatSignedPnL(activeReturn.pnl, pnlMarket)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-text-dim">이 기간에 매매 기록이 없습니다.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {periodReturns.map((r) => {
            const kr = krPeriodReturns.find((x) => x.period === r.period)
            const us = usPeriodReturns.find((x) => x.period === r.period)
            return (
              <button
                key={r.period}
                type="button"
                onClick={() => setReturnPeriod(r.period)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer',
                  returnPeriod === r.period
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-border bg-surface hover:bg-card-hover',
                )}
              >
                <p className="text-xs text-text-dim">{r.label}</p>
                {market === 'ALL' ? (
                  <div className="mt-1 space-y-0.5 text-xs font-semibold">
                    <p className={cn(kr?.returnPct && kr.returnPct > 0 && 'text-success', kr?.returnPct && kr.returnPct < 0 && 'text-danger')}>
                      국내 {formatReturnPct(kr?.returnPct ?? null)}
                    </p>
                    <p className={cn(us?.returnPct && us.returnPct > 0 && 'text-success', us?.returnPct && us.returnPct < 0 && 'text-danger')}>
                      미국 {formatReturnPct(us?.returnPct ?? null)}
                    </p>
                  </div>
                ) : (
                  <p
                    className={cn(
                      'mt-0.5 text-sm font-semibold',
                      r.returnPct !== null && r.returnPct > 0 && 'text-success',
                      r.returnPct !== null && r.returnPct < 0 && 'text-danger',
                      (r.returnPct === null || r.returnPct === 0) && 'text-text-sub',
                    )}
                  >
                    {formatReturnPct(r.returnPct)}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col items-center gap-2 p-4 lg:flex-row lg:gap-4 lg:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Wallet size={20} className="text-accent" />
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-xs text-text-sub">총 평가금액</span>
            <span className="text-sm font-bold lg:text-lg">{totalValue.toLocaleString()}</span>
          </div>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4 lg:flex-row lg:gap-4 lg:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <BarChart3 size={20} className="text-success" />
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-xs text-text-sub">보유 종목</span>
            <span className="text-sm font-bold lg:text-lg">{stockCount}개</span>
          </div>
        </Card>
        <Card className="flex flex-col items-center gap-2 p-4 lg:flex-row lg:gap-4 lg:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <TrendingUp size={20} className="text-warning" />
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-xs text-text-sub">총 거래</span>
            <span className="text-sm font-bold lg:text-lg">{totalTrades}건</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
        <Card className="flex flex-1 flex-col gap-5">
          <h2 className="text-sm font-semibold text-text-sub">종목별 비중</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300} className="lg:!h-[380px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#181A20', border: '1px solid #2A2D38', borderRadius: 12, color: '#E3E6EE' }}
                  formatter={(value, _name, props) => {
                    const m = props.payload?.market as Market | undefined
                    return [m ? formatCurrency(Number(value), m) : Number(value).toLocaleString(), '평가금액']
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-text-sub lg:h-[380px]">
              보유 종목이 없습니다. 매매를 기록해보세요.
            </div>
          )}
        </Card>

        {holdings.length > 0 && (
          <Card className="flex flex-col gap-5 lg:w-[400px]">
            <h2 className="text-sm font-semibold text-text-sub">보유 종목 상세</h2>
            <div className="flex flex-col gap-3">
              {holdings.map((h, i) => (
                <div key={h.stock_name} className="flex items-center justify-between rounded-xl bg-bg p-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium">{h.stock_name}</p>
                      <p className="text-xs text-text-sub">
                        {h.quantity}주 · 평균 {formatCurrency(h.avg_price, h.market)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(h.value, h.market)}</p>
                    <p className="text-xs text-text-sub">
                      {totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
