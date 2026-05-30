import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { resetLocalSupabaseAuth } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { BottomNav, Sidebar } from '@/components/BottomNav'
import { AuthPage, detectPasswordRecoveryHash } from '@/pages/Auth'
import { PasswordRecoveryForm } from '@/pages/PasswordRecovery'
import { DashboardPage } from '@/pages/Dashboard'
import { TradeLogPage } from '@/pages/TradeLog'
import { NewTradePage } from '@/pages/NewTrade'
import { EconomicPage } from '@/pages/Economic'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  const { user, setUser, fetchTrades, fetchStrategies, initStrategies } = useStore()
  const [ready, setReady] = useState(false)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.location.hash.includes('type=recovery')
  })

  useEffect(() => {
    // 메일 재설정 링크 진입 시, getSession 처리 전에 한 번이라도 해시 확인
    if (detectPasswordRecoveryHash()) setPasswordRecoveryMode(true)

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && /invalid api key/i.test(error.message ?? '')) {
        void resetLocalSupabaseAuth()
      }
      if (detectPasswordRecoveryHash()) setPasswordRecoveryMode(true)
      setUser(session?.user ?? null)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // 비밀번호 재설정 링크 로그인 후 이 이벤트가 와야 하는데, 버전별로 빠지면 해시 검사를 보조로 둠
      if (event === 'PASSWORD_RECOVERY') setPasswordRecoveryMode(true)
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && detectPasswordRecoveryHash()) {
        setPasswordRecoveryMode(true)
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  useEffect(() => {
    if (user && !passwordRecoveryMode) {
      fetchTrades()
      fetchStrategies().then(() => initStrategies())
    }
  }, [user, passwordRecoveryMode, fetchTrades, fetchStrategies, initStrategies])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (passwordRecoveryMode && user) {
    return (
      <PasswordRecoveryForm
        onComplete={() => {
          setPasswordRecoveryMode(false)
          if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          }
        }}
      />
    )
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-dvh bg-bg px-3 sm:px-4 lg:px-6 xl:px-8">
        <Sidebar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-20 lg:pl-4 lg:pb-0 xl:pl-6">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/trades/kr" element={<TradeLogPage />} />
                <Route path="/trades/us" element={<TradeLogPage />} />
                <Route path="/new" element={<NewTradePage />} />
                <Route path="/economic" element={<EconomicPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}
