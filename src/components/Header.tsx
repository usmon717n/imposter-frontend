// src/components/Header.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { authApi, notifApi, type Notification } from '../services/api'
import { Avatar, OnlineDot, IconUser, IconLogout, IconBell, IconGlobe, XPBar } from './ui'
import { t, getLang, setLang, type Lang } from '../i18n'
import { playSound } from '../services/sounds'

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export const Header: React.FC = () => {
  const { user, logout, setLanguage } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [drop, setDrop] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [, rerender] = useState(0)

  const isGame = location.pathname.startsWith('/room')

  useEffect(() => {
    if (!user) return
    loadNotifs()
    const t = setInterval(loadNotifs, 30000)
    return () => clearInterval(t)
  }, [user])

  async function loadNotifs() {
    try {
      const [all, cnt] = await Promise.all([notifApi.getAll(), notifApi.getUnreadCount()])
      setNotifs(all)
      if (cnt.count > unread && unread > 0) playSound('notification')
      setUnread(cnt.count)
    } catch {}
  }

  async function handleMarkAllRead() {
    await notifApi.markAllRead()
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    setDrop(false)
    navigate('/')
  }

  const handleLangChange = async (lang: Lang) => {
    setLanguage(lang)
    setLangOpen(false)
    rerender(n => n + 1)
  }

  const currentLang = LANGS.find(l => l.code === getLang()) ?? LANGS[0]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, height: 60,
      background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(22px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 24px',
      justifyContent: 'space-between', gap: 12,
    }}>
      {/* Logo */}
      <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, background: 'var(--primary)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, boxShadow: '0 0 10px var(--glow)' }}>🎭</div>
        <span style={{ fontFamily: 'var(--font-d)', fontSize: 18, letterSpacing: 3 }}>
          IMPOSTER<span style={{ color: 'var(--accent)' }}>.</span>UZ
        </span>
      </div>

      {/* Online */}
      {!isGame && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <OnlineDot />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)' }}>1,247 {t('online')}</span>
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setLangOpen(d => !d); setDrop(false); setNotifOpen(false) }}
            className="btn btn-ghost" style={{ padding: '6px 10px', gap: 5, fontSize: 12 }}>
            <IconGlobe />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{currentLang.flag} {currentLang.code.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="animate-fade-up" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 6, minWidth: 150,
              boxShadow: '0 10px 36px rgba(0,0,0,.65)',
            }}>
              {LANGS.map(lang => (
                <button key={lang.code} onClick={() => handleLangChange(lang.code)}
                  className="btn btn-ghost" style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 6,
                    display: 'flex', gap: 9, alignItems: 'center', fontSize: 13, fontWeight: 600,
                    color: getLang() === lang.code ? 'var(--accent)' : 'var(--text)',
                    textTransform: 'none', letterSpacing: 0,
                  }}>
                  {lang.flag} {lang.label}
                  {getLang() === lang.code && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 10 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <>
            {/* Notifications bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setNotifOpen(d => !d); setDrop(false); setLangOpen(false) }}
                className="btn btn-ghost" style={{ padding: '6px 10px' }}>
                <IconBell hasNew={unread > 0} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--accent)', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="animate-fade-up" style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, width: 320, maxHeight: 420, overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-d)', fontSize: 16, letterSpacing: 2 }}>{t('notifications').toUpperCase()}</span>
                    {unread > 0 && (
                      <button onClick={handleMarkAllRead} className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px', textTransform: 'none', letterSpacing: 0 }}>
                        {t('markAllRead')}
                      </button>
                    )}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted2)', fontSize: 13 }}>{t('noNotifications')}</div>
                    ) : notifs.map(n => (
                      <div key={n.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        background: n.isRead ? 'transparent' : 'rgba(139,0,0,.06)',
                        transition: 'background 0.2s',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{n.title}</span>
                          {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                        <div style={{ color: 'var(--muted2)', fontSize: 12, lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                          {new Date(n.createdAt).toLocaleDateString('uz')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setDrop(d => !d); setNotifOpen(false); setLangOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '5px 12px 5px 6px', borderRadius: 8,
                background: drop ? 'var(--surface2)' : 'transparent',
                border: '1px solid ' + (drop ? 'var(--border)' : 'transparent'),
                transition: 'all .15s',
              }}>
                <Avatar user={user} size={28} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1 }}>{user.nickname}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>LVL {user.level} · {user.xp} XP</div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 9, transition: 'transform .2s', transform: drop ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {drop && (
                <div className="animate-fade-up" style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 8, minWidth: 220,
                  boxShadow: '0 10px 36px rgba(0,0,0,.65)',
                }}>
                  {/* XP Bar in dropdown */}
                  <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                    <XPBar xp={user.xp} level={user.level} progress={user.xpProgress} />
                  </div>

                  {[
                    [<IconUser />, t('profile'), () => { navigate('/profile'); setDrop(false) }, false],
                    ['divider'],
                    [<IconLogout />, t('logout'), handleLogout, true],
                  ].map((item: any, i) =>
                    item[0] === 'divider'
                      ? <div key={i} className="divider" style={{ margin: '4px 0' }} />
                      : (
                        <button key={i} onClick={item[2]} className="btn btn-ghost" style={{
                          width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 6,
                          display: 'flex', gap: 9, alignItems: 'center',
                          color: item[3] ? 'var(--accent)' : 'var(--text)',
                          textTransform: 'none', letterSpacing: 0, fontSize: 13, fontWeight: 600,
                        }}>
                          {item[0]} {item[1]}
                        </button>
                      )
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/login')}>{t('login').toUpperCase()}</button>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => navigate('/register')}>{t('register').toUpperCase()}</button>
          </div>
        )}
      </div>
    </header>
  )
}
