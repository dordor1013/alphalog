import { createClient } from '@supabase/supabase-js'
import { clearSupabaseAuthStorage, syncSupabaseConfigFingerprint } from '@/lib/supabaseAuthStorage'

function normalizeEnvValue(raw: string): string {
  let v = raw.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim()
  }
  return v
}

const supabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL ?? '')
const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '')

if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  syncSupabaseConfigFingerprint(supabaseUrl, supabaseAnonKey)
}

/** 메일 재설정 링크(URL hash) 로그인이 안정적으로 잡히도록 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/** .env.example placeholder·빈 값·형식 오류 */
export function supabaseKeyLooksValid(): boolean {
  if (!supabaseAnonKey) return false
  if (/your-anon|your-project|placeholder|example\.com/i.test(supabaseAnonKey)) return false
  if (supabaseAnonKey.startsWith('sb_publishable_')) return supabaseAnonKey.length >= 40
  if (supabaseAnonKey.startsWith('eyJ')) return supabaseAnonKey.split('.').length === 3
  return false
}

/** 빌드에 박힌 Project URL 형식이 맞는지 (루트 `.supabase.co` 만) */
export function supabaseUrlLooksValid(): boolean {
  if (!supabaseUrl) return false
  try {
    const u = new URL(supabaseUrl)
    return u.protocol === 'https:' && /^[a-z0-9]+\.supabase\.co$/i.test(u.hostname)
  } catch {
    return false
  }
}

/** 로그인 전 Supabase Auth 엔드포인트 응답 확인 */
/** Invalid API key·키 변경 후 로컬 세션·메모리 초기화 */
export async function resetLocalSupabaseAuth(): Promise<void> {
  clearSupabaseAuthStorage()
  await supabase.auth.signOut({ scope: 'local' })
}

export async function probeSupabaseReachability(): Promise<
  'ok' | 'not_configured' | 'bad_key' | 'bad_url' | 'invalid_key' | 'unreachable'
> {
  if (!supabaseConfigured()) return 'not_configured'
  if (!supabaseUrlLooksValid()) return 'bad_url'
  if (!supabaseKeyLooksValid()) return 'bad_key'
  const base = supabaseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })
    if (res.status === 401 || res.status === 403) return 'invalid_key'
    return res.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
