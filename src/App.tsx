// src/App.tsx
import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { ToastProvider } from './components/ui'
import { useAuthStore } from './store'
import { authApi } from './services/api'
import { setLang, type Lang } from './i18n'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Profile from './pages/Profile'
import RoomSelect from './pages/RoomSelect'
import RoomPage from './pages/Room'
import AuthCallback from './pages/AuthCallback'
import './styles/global.css'

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to={`/login?next=${location.pathname}`} replace />
  return <>{children}</>
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Restore language from user preference
    if (user?.language) setLang(user.language as Lang)

    if (!user) return
    setLoading(true)
    authApi.me().then(setUser).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return <>{children}</>
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isActiveGame = location.pathname.match(/^\/room\/.+/) && !location.pathname.endsWith('/lobby')
  return (
    <>
      {!isActiveGame && <Header />}
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthLoader>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/room" element={<Protected><RoomSelect /></Protected>} />
              <Route path="/room/:code" element={<Protected><RoomPage /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthLoader>
      </ToastProvider>
    </BrowserRouter>
  )
}
