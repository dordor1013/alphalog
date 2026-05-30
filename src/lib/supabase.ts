import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

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
export async function probeSupabaseReachability(): Promise<
  'ok' | 'not_configured' | 'bad_url' | 'unreachable'
> {
  if (!supabaseConfigured()) return 'not_configured'
  if (!supabaseUrlLooksValid()) return 'bad_url'
  const base = supabaseUrl.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/auth/v1/health`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })
    return res.ok ? 'ok' : 'unreachable'
  } catch {
    return 'unreachable'
  }
}
