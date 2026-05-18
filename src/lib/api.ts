import type { EconomicIndicator } from './types'

const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY ?? ''

const FRED_BASE = 'https://api.stlouisfed.org/fred'

interface FredObservation {
  date: string
  value: string
}

const FRED_SERIES: Record<string, string> = {
  GDP: 'GDP',
  'CPI (YoY)': 'CPIAUCSL',
  'Federal Funds Rate': 'FEDFUNDS',
  'Unemployment Rate': 'UNRATE',
  '10Y Treasury Yield': 'DGS10',
  'S&P 500': 'SP500',
}

export async function fetchFredIndicators(): Promise<EconomicIndicator[]> {
  if (!FRED_API_KEY) return getPlaceholderIndicators()

  const results: EconomicIndicator[] = []

  for (const [name, seriesId] of Object.entries(FRED_SERIES)) {
    try {
      const url = `${FRED_BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`
      const res = await fetch(url)
      const data = await res.json()
      const obs: FredObservation[] = data.observations ?? []

      if (obs.length > 0) {
        const latest = obs[0]
        const prev = obs[1]
        const change = prev && latest.value !== '.' && prev.value !== '.'
          ? (parseFloat(latest.value) - parseFloat(prev.value)).toFixed(2)
          : '—'

        results.push({
          id: seriesId,
          name,
          value: latest.value === '.' ? 'N/A' : latest.value,
          change,
          date: latest.date,
          source: 'FRED',
        })
      }
    } catch {
      /* skip failed series */
    }
  }

  return results.length > 0 ? results : getPlaceholderIndicators()
}

function getPlaceholderIndicators(): EconomicIndicator[] {
  return [
    { id: 'GDP', name: 'GDP', value: '—', change: '—', date: '—', source: 'API 키를 설정해주세요' },
    { id: 'CPI', name: 'CPI (YoY)', value: '—', change: '—', date: '—', source: 'FRED' },
    { id: 'RATE', name: 'Federal Funds Rate', value: '—', change: '—', date: '—', source: 'FRED' },
    { id: 'UNEMP', name: 'Unemployment Rate', value: '—', change: '—', date: '—', source: 'FRED' },
    { id: 'DGS10', name: '10Y Treasury Yield', value: '—', change: '—', date: '—', source: 'FRED' },
    { id: 'SP500', name: 'S&P 500', value: '—', change: '—', date: '—', source: 'FRED' },
  ]
}
