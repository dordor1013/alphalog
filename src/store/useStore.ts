import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Trade, Strategy, TradeFormData, Market, TradeType } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface AppState {
  user: User | null
  trades: Trade[]
  strategies: Strategy[]
  loading: boolean

  setUser: (user: User | null) => void
  fetchTrades: () => Promise<void>
  addTrade: (data: TradeFormData) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  fetchStrategies: () => Promise<void>
  updateStrategyName: (id: string, name: string) => Promise<void>
  addStrategy: (type: TradeType) => Promise<boolean>
  deleteStrategy: (id: string) => Promise<void>
  initStrategies: () => Promise<void>
  getTradesByMarket: (market: Market) => Trade[]
  getHoldings: (market?: Market) => { stock_name: string; market: Market; quantity: number; avg_price: number; value: number }[]
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  trades: [],
  strategies: [],
  loading: false,

  setUser: (user) => set({ user }),

  fetchTrades: async () => {
    const { user } = get()
    if (!user) return

    set({ loading: true })
    const { data: trades } = await supabase
      .from('trades')
      .select('*, trade_options(*)')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: false })

    set({ trades: trades ?? [], loading: false })
  },

  addTrade: async (formData) => {
    const { user } = get()
    if (!user) return

    const { data: trade, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        market: formData.market,
        stock_name: formData.stock_name,
        trade_type: formData.trade_type,
        trade_date: formData.trade_date,
        reason: formData.reason,
      })
      .select()
      .single()

    if (error || !trade) return

    const optionRows = formData.options.map((opt) => ({
      trade_id: trade.id,
      option_number: opt.option_number,
      price: opt.price,
      quantity: opt.quantity,
    }))

    await supabase.from('trade_options').insert(optionRows)
    await get().fetchTrades()
  },

  deleteTrade: async (id) => {
    await supabase.from('trade_options').delete().eq('trade_id', id)
    await supabase.from('trades').delete().eq('id', id)
    await get().fetchTrades()
  },

  fetchStrategies: async () => {
    const { user } = get()
    if (!user) return

    const { data } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('type')
      .order('option_number')

    set({ strategies: data ?? [] })
  },

  initStrategies: async () => {
    const { user } = get()
    if (!user) return

    const types: TradeType[] = ['BUY', 'SELL']

    for (const type of types) {
      const { data: existing } = await supabase
        .from('strategies')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)

      if (existing && existing.length > 0) continue

      const defaults: Omit<Strategy, 'id'>[] = []
      for (let n = 1; n <= 3; n++) {
        defaults.push({
          user_id: user.id,
          type,
          option_number: n,
          name: `${type === 'BUY' ? '매수' : '매도'} 옵션 ${n}`,
        })
      }

      const { error } = await supabase.from('strategies').insert(defaults)
      if (error) console.error('[initStrategies]', type, error.message)
    }

    await get().fetchStrategies()
  },

  updateStrategyName: async (id, name) => {
    await supabase.from('strategies').update({ name }).eq('id', id)
    await get().fetchStrategies()
  },

  addStrategy: async (type) => {
    const { user } = get()
    if (!user) return false

    await get().fetchStrategies()
    const sameType = get().strategies.filter((s) => s.type === type)
    const nextNumber = sameType.length > 0
      ? Math.max(...sameType.map((s) => s.option_number)) + 1
      : 1

    const { error } = await supabase.from('strategies').insert({
      user_id: user.id,
      type,
      option_number: nextNumber,
      name: `${type === 'BUY' ? '매수' : '매도'} 옵션 ${nextNumber}`,
    })

    if (error) {
      console.error('[addStrategy]', error.message, error.code)
      return false
    }

    await get().fetchStrategies()
    return true
  },

  deleteStrategy: async (id) => {
    await supabase.from('strategies').delete().eq('id', id)
    await get().fetchStrategies()
  },

  getTradesByMarket: (market) => {
    return get().trades.filter((t) => t.market === market)
  },

  getHoldings: (market) => {
    const trades = market ? get().getTradesByMarket(market) : get().trades
    const map = new Map<string, { market: Market; buyQty: number; buyTotal: number; sellQty: number }>()

    for (const trade of trades) {
      for (const opt of trade.trade_options) {
        const key = `${trade.stock_name}__${trade.market}`
        const entry = map.get(key) ?? { market: trade.market, buyQty: 0, buyTotal: 0, sellQty: 0 }

        if (trade.trade_type === 'BUY') {
          entry.buyQty += opt.quantity
          entry.buyTotal += opt.amount
        } else {
          entry.sellQty += opt.quantity
        }
        map.set(key, entry)
      }
    }

    const holdings: { stock_name: string; market: Market; quantity: number; avg_price: number; value: number }[] = []

    for (const [key, entry] of map) {
      const stock_name = key.split('__')[0]
      const quantity = entry.buyQty - entry.sellQty
      if (quantity <= 0) continue

      const avg_price = entry.buyQty > 0 ? entry.buyTotal / entry.buyQty : 0
      holdings.push({
        stock_name,
        market: entry.market,
        quantity,
        avg_price: Math.round(avg_price * 100) / 100,
        value: Math.round(quantity * avg_price * 100) / 100,
      })
    }

    return holdings.sort((a, b) => b.value - a.value)
  },
}))
