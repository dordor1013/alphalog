import { useState, type CSSProperties } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type AuthScreen = 'login' | 'signup' | 'forgot'

/** 메일 재설정 링크(URL) 에 recovery 가 있는지 — 인코딩·대문자 허용 */
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

const tabInactive: CSSProperties = {
  flex: 1,
  padding: '10px 8px',
  borderRadius: 10,
  border: '1px solid #2A2D38',
  backgroundColor: '#181A20',
  color: '#848E9C',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
const tabActive: CSSProperties = {
  ...tabInactive,
  backgroundColor: '#2962FF',
  borderColor: '#2962FF',
  color: '#ffffff',
}

export function AuthPage() {
  const [screen, setScreen] = useState<AuthScreen>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!supabaseConfigured()) {
      setError('앱에 Supabase 주소/키가 설정되지 않았습니다. .env 또는 배포 환경 변수를 확인해 주세요.')
      return
    }

    setLoading(true)

    if (screen === 'forgot') {
      const trimmed = email.trim()
      if (!trimmed) {
        setError('이메일을 입력해주세요.')
        setLoading(false)
        return
      }
      const redirectTo = `${window.location.origin}${window.location.pathname}`
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (err) setError(err.message)
      else {
        setMessage(
          '재설정 안내 메일을 보냈습니다. 메일함·스팸함을 확인해 주세요. 링크를 누르면 이 사이트로 돌아와 새 비밀번호를 입력할 수 있어요.',
        )
      }
    } else if (screen === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setMessage('확인 이메일을 전송했습니다. 이메일을 확인해주세요.')
    }

    setLoading(false)
  }

  const go = (next: AuthScreen) => {
    setScreen(next)
    setError('')
    setMessage('')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', padding: '56px 28px', backgroundColor: '#0D0E12' }}>
      <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#181A20', border: '1px solid #2A2D38', borderRadius: '16px', padding: '40px 24px 36px' }}>
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#181A20]">
            <img
              src="/images/logo.png"
              alt="AlphaLog"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">AlphaLog</h1>
          <p className="text-center text-sm text-text-sub px-1">나만의 초과수익(α) 매매 일지</p>
        </div>

        {/* 초보자용: 상단 버튼 3개 — 비밀번호 찾기가 항상 같은 높이에 보임 */}
        <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }} aria-label="로그인 메뉴">
          <button type="button" onClick={() => go('login')} style={screen === 'login' ? tabActive : tabInactive}>
            로그인
          </button>
          <button type="button" onClick={() => go('signup')} style={screen === 'signup' ? tabActive : tabInactive}>
            회원가입
          </button>
          <button type="button" onClick={() => go('forgot')} style={screen === 'forgot' ? tabActive : tabInactive}>
            비번 찾기
          </button>
        </nav>

        {screen === 'forgot' && (
          <p style={{ color: '#848E9C', fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
            가입했던 <strong style={{ color: '#E3E6EE' }}>이메일</strong>을 입력하면, 비밀번호를 새로 만들 수 있는 링크를 보냅니다.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {screen !== 'forgot' && (
            <Input
              label="비밀번호"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading
              ? '처리 중...'
              : screen === 'forgot'
                ? '재설정 메일 받기'
                : screen === 'login'
                  ? '로그인'
                  : '회원가입'}
          </Button>
        </form>

        <p style={{ marginTop: 22, fontSize: 12, color: '#5E6673', lineHeight: 1.5 }}>
          메일이 안 오면 <strong style={{ color: '#848E9C' }}>스팸함</strong>을 확인하고, 웹 배포 후에는 Supabase **Authentication → URL Configuration → Redirect URLs**에 이 사이트 주소가 들어 있어야 합니다.
        </p>
      </div>
    </div>
  )
}
