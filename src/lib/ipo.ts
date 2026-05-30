import type { IpoAllotmentStatus, IpoFormData, IpoRecord } from '@/lib/types'

export const IPO_STATUS_LABELS: Record<IpoAllotmentStatus, string> = {
  PENDING: '결과 대기',
  WON: '당첨',
  LOST: '미당첨',
}

export function isIpoWon(status: IpoAllotmentStatus): boolean {
  return status === 'WON'
}

/** DB 저장용 — 미당첨·대기는 매도·배정 필드 제거 */
export function ipoFormToRow(data: IpoFormData) {
  const base = {
    stock_name: data.stock_name.trim(),
    underwriter: data.underwriter.trim(),
    subscription_date: data.subscription_date || null,
    listing_date: data.listing_date || null,
    allotment_status: data.allotment_status,
  }

  if (!isIpoWon(data.allotment_status)) {
    return {
      ...base,
      quantity: 0,
      allocation_price: null,
      sell_date: null,
      sell_price: null,
    }
  }

  const hasSell = data.sell_price > 0 && Boolean(data.sell_date)
  return {
    ...base,
    quantity: data.quantity,
    allocation_price: data.allocation_price,
    sell_date: hasSell ? data.sell_date : null,
    sell_price: hasSell ? data.sell_price : null,
  }
}

export function validateIpoForm(data: IpoFormData): string | null {
  if (!data.stock_name.trim()) return '종목명을 입력해 주세요.'
  if (!data.underwriter.trim()) return '주관사를 입력해 주세요.'
  if (!data.subscription_date) return '청약일을 입력해 주세요.'

  if (isIpoWon(data.allotment_status)) {
    if (data.quantity <= 0) return '당첨 수량(주)을 입력해 주세요.'
    if (data.allocation_price <= 0) return '배정가를 입력해 주세요.'
    const hasSellInput = data.sell_price > 0 || Boolean(data.sell_date)
    if (hasSellInput) {
      if (!data.sell_date) return '매도일을 입력해 주세요.'
      if (data.sell_price <= 0) return '매도가를 입력해 주세요.'
    }
  }

  return null
}

export function ipoRecordToForm(r: IpoRecord): IpoFormData {
  return {
    stock_name: r.stock_name,
    underwriter: r.underwriter,
    subscription_date: r.subscription_date ?? '',
    listing_date: r.listing_date ?? '',
    allotment_status: r.allotment_status,
    quantity: r.quantity ?? 0,
    allocation_price: Number(r.allocation_price ?? 0),
    sell_date: r.sell_date ?? '',
    sell_price: Number(r.sell_price ?? 0),
  }
}

/** 공모주 수익률·손익 (배정가 대비 매도가) */
export function calcIpoReturn(allocationPrice: number, sellPrice: number) {
  if (allocationPrice <= 0) return null
  const returnPct = ((sellPrice - allocationPrice) / allocationPrice) * 100
  return Math.round(returnPct * 100) / 100
}

export function calcIpoProfit(allocationPrice: number, sellPrice: number, quantity: number) {
  return Math.round((sellPrice - allocationPrice) * quantity)
}

export function formatIpoReturnPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatKrw(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '' : ''
  return `${sign}₩${Math.abs(amount).toLocaleString('ko-KR')}`
}
