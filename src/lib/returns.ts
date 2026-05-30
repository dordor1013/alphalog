import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import type { Market, Trade } from '@/lib/types'

export type ReturnPeriod = 'day' | 'week' | 'month' | 'year'

export interface PeriodReturnSummary {
  period: ReturnPeriod
  label: string
  returnPct: number | null
  pnl: number
  invested: number
  hasTrades: boolean
}

const PERIOD_LABELS: Record<ReturnPeriod, string> = {
  day: '오늘',
  week: '이번 주',
  month: '이번 달',
  year: '올해',
}

function tradeNotional(trade: Trade): number {
  return trade.trade_options.reduce((sum, o) => sum + Number(o.amount), 0)
}

function tradeQuantity(trade: Trade): number {
  return trade.trade_options.reduce((sum, o) => sum + o.quantity, 0)
}

function periodInterval(period: ReturnPeriod, ref = new Date()) {
  switch (period) {
    case 'day':
      return { start: startOfDay(ref), end: endOfDay(ref) }
    case 'week':
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) }
    case 'month':
      return { start: startOfMonth(ref), end: endOfMonth(ref) }
    case 'year':
      return { start: startOfYear(ref), end: endOfYear(ref) }
  }
}

function inPeriod(tradeDate: string, start: Date, end: Date): boolean {
  const d = parseISO(tradeDate)
  return isWithinInterval(d, { start, end })
}

type Position = { qty: number; costTotal: number }

/** 기간 내 실현손익·매수금액 → 누적 수익률(%) */
export function computePeriodReturn(trades: Trade[], period: ReturnPeriod): PeriodReturnSummary {
  const { start, end } = periodInterval(period)
  const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date))

  const positions = new Map<string, Position>()
  let periodPnL = 0
  let periodInvested = 0
  let sellCostInPeriod = 0
  let hasTrades = false

  for (const trade of sorted) {
    const key = `${trade.stock_name}__${trade.market}`
    const qty = tradeQuantity(trade)
    const amount = tradeNotional(trade)
    const inRange = inPeriod(trade.trade_date, start, end)

    if (inRange) hasTrades = true

    if (trade.trade_type === 'BUY') {
      if (inRange) periodInvested += amount
      const pos = positions.get(key) ?? { qty: 0, costTotal: 0 }
      pos.qty += qty
      pos.costTotal += amount
      positions.set(key, pos)
    } else {
      const pos = positions.get(key) ?? { qty: 0, costTotal: 0 }
      const avgCost = pos.qty > 0 ? pos.costTotal / pos.qty : 0
      const costSold = avgCost * qty
      const realized = amount - costSold

      if (inRange) {
        periodPnL += realized
        sellCostInPeriod += costSold
      }

      pos.qty = Math.max(0, pos.qty - qty)
      pos.costTotal = Math.max(0, pos.costTotal - costSold)
      positions.set(key, pos)
    }
  }

  const denominator = periodInvested > 0 ? periodInvested : sellCostInPeriod
  const returnPct = denominator > 0 ? (periodPnL / denominator) * 100 : null

  return {
    period,
    label: PERIOD_LABELS[period],
    returnPct,
    pnl: Math.round(periodPnL * 100) / 100,
    invested: Math.round(denominator * 100) / 100,
    hasTrades,
  }
}

export function computeAllPeriodReturns(trades: Trade[]): PeriodReturnSummary[] {
  const periods: ReturnPeriod[] = ['day', 'week', 'month', 'year']
  return periods.map((p) => computePeriodReturn(trades, p))
}

export function filterTradesByMarket(trades: Trade[], market: Market | 'ALL'): Trade[] {
  if (market === 'ALL') return trades
  return trades.filter((t) => t.market === market)
}

export function formatReturnPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatSignedPnL(value: number, market: Market): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  if (market === 'US') {
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${sign}₩${Math.round(value).toLocaleString('ko-KR')}`
}
