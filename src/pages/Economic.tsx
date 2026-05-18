import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { fetchFredIndicators } from '@/lib/api'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EconomicIndicator } from '@/lib/types'
import { PAGE_SHELL } from '@/lib/pageLayout'

export function EconomicPage() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const ind = await fetchFredIndicators()
    setIndicators(ind)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const changeIcon = (change: string) => {
    const num = parseFloat(change)
    if (isNaN(num) || num === 0) return <Minus size={14} className="text-text-dim" />
    if (num > 0) return <TrendingUp size={14} className="text-success" />
    return <TrendingDown size={14} className="text-buy" />
  }

  return (
    <div className={PAGE_SHELL}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">경제지표</h1>
        <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-text-sub">주요 경제지표</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
          {indicators.map((ind) => (
            <Card key={ind.id} className="p-4">
              <p className="text-xs text-text-sub">{ind.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold">{ind.value}</span>
                <span className="flex items-center gap-1 text-xs">
                  {changeIcon(ind.change)}
                  {ind.change}
                </span>
              </div>
              <p className="mt-2 text-xs text-text-dim">{ind.date} · {ind.source}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
