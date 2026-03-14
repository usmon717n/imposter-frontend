// src/pages/Auth.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi, setTokens } from '../services/api'
import { useAuthStore } from '../store'
import { BgOrbs, Spinner } from '../components/ui'
import { useToast } from '../components/ui'
import { t } from '../i18n'

type Mode = 'login' | 'register'
type Step = 'main' | 'nickname'

export default function Auth({ mode }: { mode: Mode }) {
  const [step, setStep] = useState<Step>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()
  const isReg = mode === 'register'

  const finishAuth = (data: any) => {
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    if (data.needsNickname || data.user?.needsNickname) {
      setStep('nickname')
    } else {
      toast(`Xush kelibsiz, ${data.user.nickname}! 🎭`, 'success')
      navigate('/')
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = authApi.googleUrl()
  }

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !email.includes('@')) {
      setError("To'g'ri email kiriting")
      return
    }
    if (password.length < 6) {
      setError('Parol kamida 6 belgi bo\'lishi kerak')
      return
    }
    setLoading(true)
    try {
      const data = isReg
        ? await authApi.registerWithEmail(email.trim(), password)
        : await authApi.loginWithEmail(email.trim(), password)
      finishAuth(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetNickname = async () => {
    setError('')
    if (nickname.length < 3) {
      setError('Nickname kamida 3 belgi bo\'lishi kerak')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      setError('Faqat harf, raqam va _ ishlating')
      return
    }
    setLoading(true)
    try {
      const data = await authApi.setNickname(nickname)
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)
      toast(`Xush kelibsiz, ${nickname}! 🎭`, 'success')
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '80px 16px 40px', position: 'relative',
    }}>
      <BgOrbs />
      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎭</div>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 30, letterSpacing: 4 }}>
            {step === 'nickname' ? t('chooseNickname') : isReg ? t('registerTitle') : t('loginTitle')}
          </h2>
          <p style={{ color: 'var(--muted2)', fontSize: 13, marginTop: 7, lineHeight: 1.5 }}>
            {step === 'nickname'
              ? 'O\'yindagi noyob ismingizni tanlang'
              : isReg
              ? "Hoziroq ro'yxatdan o'ting va o'ynang"
              : 'Hisobingizga kiring'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box" style={{ marginBottom: 18 }}>⚠ {error}</div>
        )}

        {/* ── Nickname step ── */}
        {step === 'nickname' && (
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>
              NICKNAME
            </label>
            <input
              className="input"
              placeholder="masalan: ShadowWolf47"
              value={nickname}
              onChange={e => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
              onKeyDown={e => e.key === 'Enter' && handleSetNickname()}
              maxLength={20}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', margin: '7px 0 22px' }}>
              <span>{t('nicknameHint')}</span>
              <span>{nickname.length}/20</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 13 }}
              onClick={handleSetNickname}
              disabled={loading || nickname.length < 3}
            >
              {loading ? <Spinner /> : t('continueBtn')}
            </button>
          </div>
        )}

        {/* ── LOGIN form ── */}
        {step === 'main' && !isReg && (
          <div>
            {/* Email field */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>
                EMAIL
              </label>
              <input
                className="input"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>
                PAROL
              </label>
              <input
                className="input"
                type="password"
                placeholder="Parolingizni kiriting"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Login button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 13, marginBottom: 14 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Spinner /> : t('loginBtn')}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{t('orText')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Google login */}
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%', padding: '12px 18px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, cursor: 'pointer', transition: 'all .18s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
                fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text)', fontSize: 14,
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.borderColor = '#4285F4' }}
              onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--border)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('googleLogin')}
            </button>

            {/* Switch to register */}
            <div className="divider" style={{ margin: '20px 0' }} />
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {t('noAccount')}{' '}
              <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                {t('register')}
              </Link>
            </p>
          </div>
        )}

        {/* ── REGISTER form ── */}
        {step === 'main' && isReg && (
          <div>
            {/* Email field */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>
                EMAIL
              </label>
              <input
                className="input"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>
                PAROL
              </label>
              <input
                className="input"
                type="password"
                placeholder="Kamida 6 belgi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>
                Raqamlar ham qabul qilinadi
              </div>
            </div>

            {/* Register button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 13, marginBottom: 14 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Spinner /> : t('registerBtn')}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{t('orText')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Google register */}
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%', padding: '12px 18px', marginBottom: 20,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, cursor: 'pointer', transition: 'all .18s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
                fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text)', fontSize: 14,
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.borderColor = '#4285F4' }}
              onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--border)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('googleRegister')}
            </button>

            {/* Switch to login */}
            <div className="divider" style={{ margin: '0 0 16px' }} />
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {t('hasAccount')}{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                {t('login')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
