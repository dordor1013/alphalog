import { useState } from 'react'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!supabaseConfigured()) {
      setError('Supabase 주소/키가 설정되지 않았습니다. .env 또는 배포 환경 변수를 확인해 주세요.')
      return
    }

    setLoading(true)

    if (forgotMode) {
      const trimmed = email.trim()
      if (!trimmed) { setError('이메일을 입력해주세요.'); setLoading(false); return }
      const redirectTo = `${window.location.origin}${window.location.pathname}`
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (err) setError(err.message)
      else setMessage('재설정 메일을 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.')
    } else if (isLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        setShowForgotHint(true)
      }
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setMessage('확인 이메일을 전송했습니다. 이메일을 확인해주세요.')
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
