import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function PasswordRecoveryForm({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('비밀번호가 서로 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    setMessage('')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setMessage('비밀번호가 변경되었습니다. 이제 이 비밀번호로 로그인할 수 있습니다.')
    setPassword('')
    setConfirm('')
    setTimeout(() => onComplete(), 1200)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-7 py-14">
      <div className="w-full max-w-[340px] rounded-2xl border border-border bg-card px-7 py-10">
        <h1 className="text-center text-xl font-bold tracking-tight">새 비밀번호 설정</h1>
        <p className="mt-2 text-center text-sm text-text-sub leading-relaxed">
          메일 링크로 들어오신 경우 아래에 새 비밀번호를 입력해 주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Input
            label="새 비밀번호"
            type="password"
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            placeholder="한 번 더 입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
          <Button type="submit" size="lg" disabled={loading || !!message} className="w-full">
            {loading ? '저장 중...' : message ? '저장 완료' : '비밀번호 변경'}
          </Button>
        </form>
      </div>
    </div>
  )
}
