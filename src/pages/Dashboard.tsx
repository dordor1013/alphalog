import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, BarChart3, Wallet } from 'lucide-react'
import { formatCurrency, type Market } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'

const COLORS = ['#2962FF', '#F23645', '#0ECB81', '#F0B90B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899']

export function DashboardPage() {
  const [market, setMarket] = useState<Market | 'ALL'>('ALL')
  const { trades, getHoldings } = useStore()

  const holdings = market === 'ALL' ? getHoldings() : getHoldings(market)
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)

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
