import { Preferences } from '@capacitor/preferences'

/**
 * 폰 로컬 저장소(Capacitor Preferences) 위에 올린 단순 컬렉션 저장 계층.
 * 웹(dev)에서는 Preferences가 localStorage로 폴백되므로 동일 API로 동작한다.
 */

export const COLLECTIONS = {
  trades: 'trades',
  strategies: 'strategies',
  ipoRecords: 'ipo_records',
} as const

export type CollectionKey = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

export async function getCollection<T>(key: CollectionKey): Promise<T[]> {
  const { value } = await Preferences.get({ key })
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export async function setCollection<T>(key: CollectionKey, items: T[]): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(items) })
}

export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export interface ExportBundle {
  app: 'AlphaLog'
  version: 1
  exportedAt: string
  data: Record<CollectionKey, unknown[]>
}

/** 전체 데이터를 백업용 객체로 추출 */
export async function exportAll(): Promise<ExportBundle> {
  const entries = await Promise.all(
    Object.values(COLLECTIONS).map(async (key) => [key, await getCollection(key)] as const),
  )
  return {
    app: 'AlphaLog',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(entries) as Record<CollectionKey, unknown[]>,
  }
}

/** 백업 객체를 검증하고 전체 데이터를 덮어쓴다 */
export async function importAll(bundle: unknown): Promise<void> {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('백업 파일 형식이 올바르지 않습니다.')
  }
  const b = bundle as Partial<ExportBundle>
  if (b.app !== 'AlphaLog' || !b.data || typeof b.data !== 'object') {
    throw new Error('AlphaLog 백업 파일이 아닙니다.')
  }
  for (const key of Object.values(COLLECTIONS)) {
    const items = (b.data as Record<string, unknown>)[key]
    if (items !== undefined && !Array.isArray(items)) {
      throw new Error('백업 파일의 데이터가 손상되었습니다.')
    }
  }
  await Promise.all(
    Object.values(COLLECTIONS).map((key) => {
      const items = (b.data as Record<string, unknown[]>)[key] ?? []
      return setCollection(key, items)
    }),
  )
}
