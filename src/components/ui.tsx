// src/components/ui.tsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'

// ─── Icons (SVG animated) ─────────────────────────────────────────────────────
export const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
export const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
export const IconBell = ({ hasNew = false }: { hasNew?: boolean }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: hasNew ? 'bellRing 1s ease-in-out infinite' : 'none' }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {hasNew && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
  </div>
)
export const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
export const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
export const IconGamepad = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
    <circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="17" cy="11" r="1" fill="currentColor"/>
    <rect x="2" y="6" width="20" height="12" rx="5"/>
  </svg>
)
export const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
export const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M7 4H17v5a5 5 0 0 1-10 0V4z"/><path d="M7 9H2v2a5 5 0 0 0 5 5"/><path d="M17 9h5v2a5 5 0 0 1-5 5"/>
  </svg>
)
export const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-3M6 12H3M12 21v-3M12 6V3"/>
  </svg>
)
export const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
export const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
export const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
export const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
export const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
export const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
export const IconUserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
)

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar: React.FC<{ user?: { nickname?: string; avatarUrl?: string } | null; size?: number; style?: React.CSSProperties }> = ({ user, size = 36, style }) => (
  <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, ...style }}>
    {user?.avatarUrl
      ? <img src={user.avatarUrl} alt={user.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span>{user?.nickname?.[0]?.toUpperCase() ?? '?'}</span>}
  </div>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <div className="spinner" style={{ width: size, height: size }} />
)

// ─── Background Orbs ─────────────────────────────────────────────────────────
export const BgOrbs: React.FC = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {[
      { w: 450, top: '5%', left: '-12%', delay: '0s' },
      { w: 320, top: '65%', right: '-8%', delay: '3.5s' },
      { w: 220, top: '38%', left: '48%', delay: '7s' },
    ].map((o, i) => (
      <div key={i} className="bg-orb" style={{
        width: o.w, height: o.w, top: o.top, left: o.left, right: (o as any).right,
        background: 'radial-gradient(circle, rgba(139,0,0,0.18) 0%, transparent 68%)',
        animation: 'orbFloat 9s ease-in-out infinite', animationDelay: o.delay,
      }} />
    ))}
  </div>
)

// ─── Online Dot ───────────────────────────────────────────────────────────────
export const OnlineDot: React.FC<{ color?: string }> = ({ color = '#22c55e' }) => (
  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
)

// ─── XP Bar ───────────────────────────────────────────────────────────────────
export const XPBar: React.FC<{ xp: number; level: number; progress?: { current: number; needed: number; percent: number } }> = ({ xp, level, progress }) => {
  const pct = progress?.percent ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        background: 'var(--primary)', borderRadius: 4, padding: '2px 8px',
        fontFamily: 'var(--font-d)', fontSize: 14, letterSpacing: 1, color: '#fff', flexShrink: 0,
      }}>
        <IconZap /> {level}
      </div>
      <div style={{ flex: 1, height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          borderRadius: 3, transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', flexShrink: 0 }}>
        {xp} XP
      </span>
    </div>
  )
}

// ─── XP Popup ─────────────────────────────────────────────────────────────────
export const XPPopup: React.FC<{ xpGained: number; leveledUp?: boolean; newLevel?: number; onClose: () => void }> = ({ xpGained, leveledUp, newLevel, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      zIndex: 9999, textAlign: 'center', pointerEvents: 'none',
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{
        background: leveledUp ? 'var(--primary)' : 'var(--surface)',
        border: `2px solid ${leveledUp ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 16, padding: '20px 36px',
        boxShadow: leveledUp ? '0 0 40px var(--glow)' : '0 10px 40px rgba(0,0,0,0.5)',
      }}>
        {leveledUp ? (
          <>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 28, letterSpacing: 4, color: '#fff' }}>LEVEL {newLevel}!</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>Daraja ko'tarildi!</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, color: xpGained > 0 ? 'var(--green)' : 'var(--accent)', letterSpacing: 2 }}>
              {xpGained > 0 ? '+' : ''}{xpGained} XP
            </div>
            <div style={{ color: 'var(--muted2)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {xpGained > 0 ? 'Qo\'shildi!' : 'Ayirildi'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Toast system ─────────────────────────────────────────────────────────────
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }
const ToastCtx = createContext<(msg: string, type?: Toast['type']) => void>(() => {})

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export const Page: React.FC<{ children: React.ReactNode; center?: boolean; maxWidth?: number }> = ({ children, center, maxWidth = 1100 }) => (
  <div style={{ minHeight: '100vh', paddingTop: 60, position: 'relative', display: center ? 'flex' : undefined, alignItems: center ? 'center' : undefined, justifyContent: center ? 'center' : undefined }}>
    <BgOrbs />
    <div style={{ position: 'relative', zIndex: 1, maxWidth, margin: '0 auto', padding: '0 20px', width: '100%' }}>
      {children}
    </div>
  </div>
)

// ─── Loading page ─────────────────────────────────────────────────────────────
export const LoadingPage: React.FC<{ text?: string }> = ({ text = 'Yuklanmoqda...' }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
    <Spinner size={32} />
    <p style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{text}</p>
  </div>
)

// ─── Countdown timer ─────────────────────────────────────────────────────────
export const Countdown: React.FC<{ endsAt: string | null; danger?: number; style?: React.CSSProperties }> = ({ endsAt, danger = 30, style }) => {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!endsAt) return
    const upd = () => setSecs(Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)))
    upd()
    const t = setInterval(upd, 1000)
    return () => clearInterval(t)
  }, [endsAt])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const isDanger = secs <= danger && secs > 0
  return (
    <span style={{ fontFamily: 'var(--font-d)', fontSize: 'inherit', color: isDanger ? 'var(--accent)' : undefined, animation: isDanger ? 'timerPulse 1s ease-in-out infinite' : undefined, ...style }}>
      {mm}:{ss}
    </span>
  )
}
