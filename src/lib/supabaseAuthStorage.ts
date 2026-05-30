const CONFIG_FINGERPRINT_KEY = 'alphalog-supabase-config'

/** Supabase Auth가 localStorage에 남긴 세션 키 제거 */
export function clearSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('sb-') && k.includes('-auth-token')) {
        localStorage.removeItem(k)
      }
    }
  } catch {
    /* ignore */
  }
}

/** URL·키가 바뀌면 예전 세션으로 refresh 하다 Invalid API key 나는 경우 방지 */
export function syncSupabaseConfigFingerprint(url: string, key: string): void {
  if (typeof window === 'undefined' || !url || !key) return
  const fingerprint = `${url}|${key.slice(0, 16)}`
  try {
    const prev = localStorage.getItem(CONFIG_FINGERPRINT_KEY)
    if (prev && prev !== fingerprint) {
      clearSupabaseAuthStorage()
    }
    localStorage.setItem(CONFIG_FINGERPRINT_KEY, fingerprint)
  } catch {
    /* ignore */
  }
}
