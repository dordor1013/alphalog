export type Market = 'KR' | 'US'
export type TradeType = 'BUY' | 'SELL'

export interface Strategy {
  id: string
  user_id: string
  type: TradeType
  option_number: number
  name: string
}

export interface TradeOption {
  id: string
  trade_id: string
  option_number: number
  price: number
  quantity: number
  amount: number
}

export interface Trade {
  id: string
  user_id: string
  market: Market
  stock_name: string
  trade_type: TradeType
  trade_date: string
  reason: string
  created_at: string
  trade_options: TradeOption[]
}

export interface TradeFormData {
  market: Market
  stock_name: string
  trade_type: TradeType
  trade_date: string
  reason: string
  options: {
    option_number: number
    price: number
    quantity: number
  }[]
}

export interface PortfolioItem {
  stock_name: string
  market: Market
  total_quantity: number
  avg_price: number
  total_value: number
  percentage: number
}

export type IpoAllotmentStatus = 'PENDING' | 'WON' | 'LOST'

export interface IpoRecord {
  id: string
  user_id: string
  stock_name: string
  underwriter: string
  subscription_date: string | null
  listing_date: string | null
  allotment_status: IpoAllotmentStatus
  quantity: number
  allocation_price: number | null
  sell_date: string | null
  sell_price: number | null
  created_at: string
}

export interface IpoFormData {
  stock_name: string
  underwriter: string
  subscription_date: string
  listing_date: string
  allotment_status: IpoAllotmentStatus
  quantity: number
  allocation_price: number
  sell_date: string
  sell_price: number
}

export interface EconomicIndicator {
  id: string
  name: string
  value: string
  change: string
  date: string
  source: string
}

export function formatCurrency(value: number, market: Market): string {
  if (market === 'US') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `₩${value.toLocaleString('ko-KR')}`
}

export function currencySymbol(market: Market): string {
  return market === 'US' ? '$' : '₩'
}

export function currencyUnit(market: Market): string {
  return market === 'US' ? 'USD' : 'KRW'
}
