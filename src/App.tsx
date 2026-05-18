import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { BottomNav, Sidebar } from '@/components/BottomNav'
import { AuthPage } from '@/pages/Auth'
import { DashboardPage } from '@/pages/Dashboard'
import { TradeLogPage } from '@/pages/TradeLog'
import { NewTradePage } from '@/pages/NewTrade'
import { EconomicPage } from '@/pages/Economic'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  const { user, setUser, fetchTrades, fetchStrategies, initStrategies } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  useEffect(() => {
    if (user) {
      fetchTrades()
      fetchStrategies().then(() => initStrategies())
    }
  }, [user, fetchTrades, fetchStrategies, initStrategies])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) return <AuthPage />

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
