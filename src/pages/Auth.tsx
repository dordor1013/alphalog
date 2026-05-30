import { useEffect, useState } from 'react'
import {
  probeSupabaseReachability,
  supabase,
  supabaseConfigured,
  supabaseKeyLooksValid,
  supabaseUrlLooksValid,
} from '@/lib/supabase'
import { resetLocalSupabaseAuth } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/** Supabase Auth 영문 오류 → 한국어 안내 */
function formatSupabaseAuthError(raw?: string, code?: string): string {
  const m = (raw ?? '').trim()
  const c = (code ?? '').toLowerCase()

  if (c === 'invalid_credentials' || /invalid\s*login\s*credentials/i.test(m)) {
    return (
      '이메일 또는 비밀번호가 올바르지 않습니다. ' +
      '이 사이트에 아직 가입하지 않았다면 아래 「회원가입」을 이용해 주세요. ' +
      '가입은 했는데 비밀번호가 기억나지 않으면 「비밀번호를 잊으셨나요?」로 재설정할 수 있습니다.'
    )
  }
  if (!m) return '알 수 없는 오류가 났습니다. 잠시 후 다시 시도해 주세요.'
  if (/failed to fetch|networkerror|network request failed|load failed|네트워크/i.test(m)) {
    return (
      'Supabase에 연결할 수 없습니다. (1) Supabase 대시보드에서 프로젝트가 삭제·일시중지되지 않았는지, ' +
      '(2) API URL이 https://프로젝트ref.supabase.co 형태인지(/rest/v1/ 없음), ' +
      '(3) Vercel Environment Variables의 URL·anon 키가 같은 프로젝트에서 복사한 짝인지 확인한 뒤 Production·Preview에 넣고 Redeploy 해 주세요.'
    )
  }
  if (/invalid api key/i.test(m)) {
    return (
      'Supabase API 키가 맞지 않습니다. Project Settings → Data API의 API URL과 ' +
      'API Keys의 Publishable(또는 anon) 키를 한 쌍으로 Vercel·.env에 넣은 뒤 Redeploy 해 주세요.'
    )
  }
  if (c === 'user_already_exists' || /already registered|already been registered/i.test(m)) {
    return (
      '이 이메일은 이미 가입되어 있습니다. 회원가입 대신 「로그인」을 하거나, 비밀번호를 모르면 「비밀번호를 잊으셨나요?」로 재설정하세요. 재설정 시에는 예전과 다른 새 비밀번호를 입력해야 합니다.'
    )
  }
  if (
    c === 'over_email_send_rate_limit' ||
    /email rate limit exceeded/i.test(m)
  ) {
    return (
      '가입 확인 메일을 너무 많이 보내서 잠시 제한되었습니다. 30분~1시간 뒤 다시 시도하거나, ' +
      'Supabase 무료 플랜은 시간당 확인 메일 개수가 매우 적습니다. 관리자가 Authentication → Rate Limits를 확인해 주세요.'
    )
  }
  return m
}

export function detectPasswordRecoveryHash(): boolean {
  if (typeof window === 'undefined') return false
  const raw = window.location.hash
  try {
    const decoded = decodeURIComponent(raw)
    return /type[=']recovery/i.test(decoded + raw)
  } catch {
    return raw.includes('type=recovery')
  }
}

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [forgotMode, setForgotMode] = useState(false)
  const [showForgotHint, setShowForgotHint] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [connectionHint, setConnectionHint] = useState('')

  useEffect(() => {
    if (!supabaseConfigured()) {
      setConnectionHint('Supabase URL·키가 비어 있습니다. .env 또는 Vercel 환경 변수를 설정해 주세요.')
      return
    }
    if (!supabaseUrlLooksValid()) {
      setConnectionHint(
        'Supabase 주소 형식이 잘못되었습니다. https://프로젝트ref.supabase.co 만 사용하세요. (/rest/v1/ 금지)',
      )
      return
    }
    if (!supabaseKeyLooksValid()) {
      setConnectionHint(
        'Supabase API 키 형식이 잘못되었습니다. Project Settings → API Keys에서 Publishable(sb_publishable_…) 또는 anon(eyJ…) 키를 복사해 .env·Vercel에 넣고, 개발 서버를 재시작하거나 배포를 Redeploy 하세요.',
      )
      return
    }
    let cancelled = false
    probeSupabaseReachability().then((status) => {
      if (cancelled) return
      if (status === 'invalid_key' || status === 'bad_key') {
        void resetLocalSupabaseAuth()
        setConnectionHint(
          'Supabase API 키가 거부되었습니다. 대시보드에서 URL·Publishable(또는 anon) 키를 같은 프로젝트에서 다시 복사해 넣은 뒤, 브라우저에서 강력 새로고침(Ctrl+Shift+R) 또는 PWA를 삭제 후 다시 접속하세요. 로컬은 npm run setup:finish 후 npm run dev 재시작.',
        )
      } else if (status === 'unreachable') {
        setConnectionHint(
          '지금 설정된 Supabase 주소에 연결되지 않습니다. 프로젝트가 삭제됐거나 URL·anon 키가 서로 다른 프로젝트 것일 수 있습니다. Supabase → Project Settings → API에서 다시 복사해 Vercel에 넣고 Redeploy 하세요.',
        )
      } else {
        setConnectionHint('')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!supabaseConfigured()) {
      setError('Supabase 주소/키가 설정되지 않았습니다. .env 또는 배포 환경 변수를 확인해 주세요.')
      return
    }

    setLoading(true)

    const onAuthError = (err: { message?: string; code?: string }) => {
      const msg = formatSupabaseAuthError(err.message, err.code)
      if (/invalid api key/i.test(err.message ?? '')) {
        void resetLocalSupabaseAuth()
        setError(
          `${msg} 예전 앱 캐시가 남았을 수 있습니다. 강력 새로고침(Ctrl+Shift+R) 후 다시 로그인해 주세요.`,
        )
      } else {
        setError(msg)
      }
    }

    if (forgotMode) {
      const trimmed = email.trim()
      if (!trimmed) { setError('이메일을 입력해주세요.'); setLoading(false); return }
      const redirectTo = `${window.location.origin}${window.location.pathname}`
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (err) onAuthError(err)
      else setMessage('재설정 메일을 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.')
    } else if (isLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        onAuthError(err)
        // 비번 틀림 등일 때만 비번 찾기 안내 — 네트워크 장애일 땐 혼동 방지
        if (!/failed to fetch|networkerror|network request failed|load failed|invalid api key/i.test(err.message ?? '')) {
          setShowForgotHint(true)
        }
      }
    } else {
      const emailRedirectTo = `${window.location.origin}${window.location.pathname}`
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      })
      if (err) onAuthError(err)
      else {
        setMessage('회원가입이 완료되었습니다. 잠시 후 로그인됩니다.')
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', padding: '56px 28px', backgroundColor: '#0D0E12' }}>
      <div style={{ width: '100%', maxWidth: '340px', backgroundColor: '#181A20', border: '1px solid #2A2D38', borderRadius: '16px', padding: '44px 28px 40px' }}>
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#181A20]">
            <img src="/images/logo.png" alt="AlphaLog" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AlphaLog</h1>
          <p className="text-sm text-text-sub">나만의 초과수익(α) 매매 일지</p>
        </div>

        {forgotMode ? (
          <>
            <p className="mb-5 text-sm text-text-sub leading-relaxed">
              가입했던 이메일을 입력하면 비밀번호를 새로 만들 수 있는 링크를 보냅니다.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input label="이메일" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
                {loading ? '처리 중...' : '재설정 메일 받기'}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(''); setMessage('') }}
              className="mt-6 w-full text-center text-sm text-text-sub hover:text-text transition-colors cursor-pointer"
            >
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <>
            {connectionHint && (
              <p className="mb-5 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger leading-relaxed">
                {connectionHint}
              </p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input label="이메일" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="비밀번호" type="password" placeholder="6자 이상" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              {showForgotHint && isLogin && (
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(''); setMessage(''); setShowForgotHint(false) }}
                  className="w-full text-center text-sm text-accent hover:text-accent-hover transition-colors cursor-pointer"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
              {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
                {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); setShowForgotHint(false) }}
              className="mt-8 w-full text-center text-sm text-text-sub hover:text-text transition-colors cursor-pointer"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
