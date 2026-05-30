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
