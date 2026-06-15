import { create } from 'zustand'
import { ipoFormToRow } from '@/lib/ipo'
import {
  COLLECTIONS,
  genId,
  getCollection,
  setCollection,
} from '@/lib/localdb'
import type {
  Trade,
  TradeOption,
  Strategy,
  TradeFormData,
  Market,
  TradeType,
  IpoRecord,
  IpoFormData,
} from '@/lib/types'

interface AppState {
  trades: Trade[]
  strategies: Strategy[]
  ipoRecords: IpoRecord[]
  loading: boolean

  loadAll: () => Promise<void>
  fetchTrades: () => Promise<void>
  addTrade: (data: TradeFormData) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  fetchStrategies: () => Promise<void>
  updateStrategyName: (id: string, name: string) => Promise<void>
  addStrategy: (type: TradeType) => Promise<boolean>
  deleteStrategy: (id: string) => Promise<void>
  initStrategies: () => Promise<void>
  fetchIpoRecords: () => Promise<void>
  addIpoRecord: (data: IpoFormData) => Promise<boolean>
  updateIpoRecord: (id: string, data: IpoFormData) => Promise<boolean>
  deleteIpoRecord: (id: string) => Promise<void>
  getTradesByMarket: (market: Market) => Trade[]
  getHoldings: (market?: Market) => { stock_name: string; market: Market; quantity: number; avg_price: number; value: number }[]
}

function sortTrades(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    if (a.trade_date !== b.trade_date) return a.trade_date < b.trade_date ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })
}

function sortStrategies(strategies: Strategy[]): Strategy[] {
  return [...strategies].sort((a, b) => {
    if (a.type !== b.type) return a.type < b.type ? -1 : 1
    return a.option_number - b.option_number
  })
}

function sortIpoRecords(records: IpoRecord[]): IpoRecord[] {
  return [...records].sort((a, b) => {
    const aSub = a.subscription_date ?? ''
    const bSub = b.subscription_date ?? ''
    if (aSub !== bSub) return aSub < bSub ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })
}

export const useStore = create<AppState>((set, get) => ({
  trades: [],
  strategies: [],
  ipoRecords: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true })
    await Promise.all([get().fetchTrades(), get().fetchStrategies(), get().fetchIpoRecords()])
    await get().initStrategies()
    set({ loading: false })
  },

  fetchTrades: async () => {
    const trades = await getCollection<Trade>(COLLECTIONS.trades)
    set({ trades: sortTrades(trades) })
  },

  addTrade: async (formData) => {
    const trades = await getCollection<Trade>(COLLECTIONS.trades)
    const tradeId = genId()
    const options: TradeOption[] = formData.options.map((opt) => ({
      id: genId(),
      trade_id: tradeId,
      option_number: opt.option_number,
      price: opt.price,
      quantity: opt.quantity,
      amount: Math.round(opt.price * opt.quantity * 100) / 100,
    }))

    const trade: Trade = {
      id: tradeId,
      market: formData.market,
      stock_name: formData.stock_name,
      trade_type: formData.trade_type,
      trade_date: formData.trade_date,
      reason: formData.reason,
      created_at: new Date().toISOString(),
      trade_options: options,
    }

    await setCollection(COLLECTIONS.trades, [...trades, trade])
    await get().fetchTrades()
  },

  deleteTrade: async (id) => {
    const trades = await getCollection<Trade>(COLLECTIONS.trades)
    await setCollection(
      COLLECTIONS.trades,
      trades.filter((t) => t.id !== id),
    )
    await get().fetchTrades()
  },

  fetchStrategies: async () => {
    const strategies = await getCollection<Strategy>(COLLECTIONS.strategies)
    set({ strategies: sortStrategies(strategies) })
  },

  initStrategies: async () => {
    const strategies = await getCollection<Strategy>(COLLECTIONS.strategies)
    const types: TradeType[] = ['BUY', 'SELL']
    const toAdd: Strategy[] = []

    for (const type of types) {
      const hasType = strategies.some((s) => s.type === type)
      if (hasType) continue
      for (let n = 1; n <= 3; n++) {
        toAdd.push({
          id: genId(),
          type,
          option_number: n,
          name: `${type === 'BUY' ? '매수' : '매도'} 옵션 ${n}`,
        })
      }
    }

    if (toAdd.length > 0) {
      await setCollection(COLLECTIONS.strategies, [...strategies, ...toAdd])
      await get().fetchStrategies()
    }
  },

  updateStrategyName: async (id, name) => {
    const strategies = await getCollection<Strategy>(COLLECTIONS.strategies)
    await setCollection(
      COLLECTIONS.strategies,
      strategies.map((s) => (s.id === id ? { ...s, name } : s)),
    )
    await get().fetchStrategies()
  },

  addStrategy: async (type) => {
    const strategies = await getCollection<Strategy>(COLLECTIONS.strategies)
    const sameType = strategies.filter((s) => s.type === type)
    const nextNumber = sameType.length > 0 ? Math.max(...sameType.map((s) => s.option_number)) + 1 : 1

    const newStrategy: Strategy = {
      id: genId(),
      type,
      option_number: nextNumber,
      name: `${type === 'BUY' ? '매수' : '매도'} 옵션 ${nextNumber}`,
    }

    await setCollection(COLLECTIONS.strategies, [...strategies, newStrategy])
    await get().fetchStrategies()
    return true
  },

  deleteStrategy: async (id) => {
    const strategies = await getCollection<Strategy>(COLLECTIONS.strategies)
    await setCollection(
      COLLECTIONS.strategies,
      strategies.filter((s) => s.id !== id),
    )
    await get().fetchStrategies()
  },

  fetchIpoRecords: async () => {
    const records = await getCollection<IpoRecord>(COLLECTIONS.ipoRecords)
    set({ ipoRecords: sortIpoRecords(records) })
  },

  addIpoRecord: async (formData) => {
    const records = await getCollection<IpoRecord>(COLLECTIONS.ipoRecords)
    const record: IpoRecord = {
      id: genId(),
      created_at: new Date().toISOString(),
      ...ipoFormToRow(formData),
    }
    await setCollection(COLLECTIONS.ipoRecords, [...records, record])
    await get().fetchIpoRecords()
    return true
  },

  updateIpoRecord: async (id, formData) => {
    const records = await getCollection<IpoRecord>(COLLECTIONS.ipoRecords)
    await setCollection(
      COLLECTIONS.ipoRecords,
      records.map((r) => (r.id === id ? { ...r, ...ipoFormToRow(formData) } : r)),
    )
    await get().fetchIpoRecords()
    return true
  },

  deleteIpoRecord: async (id) => {
    const records = await getCollection<IpoRecord>(COLLECTIONS.ipoRecords)
    await setCollection(
      COLLECTIONS.ipoRecords,
      records.filter((r) => r.id !== id),
    )
    await get().fetchIpoRecords()
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
