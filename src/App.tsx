import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { BottomNav, Sidebar } from '@/components/BottomNav'
import { DashboardPage } from '@/pages/Dashboard'
import { TradeLogPage } from '@/pages/TradeLog'
import { NewTradePage } from '@/pages/NewTrade'
import { SettingsPage } from '@/pages/Settings'
import { IpoNotesPage } from '@/pages/IpoNotes'

export default function App() {
  const { loadAll } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadAll()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [loadAll])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <HashRouter>
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
                <Route path="/ipo" element={<IpoNotesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </HashRouter>
  )
}
