// src/pages/Profile.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi, friendsApi, type Friend } from '../services/api'
import { useAuthStore } from '../store'
import { Page, Avatar, Spinner, XPBar, IconArrowLeft, IconUserPlus, IconCheck, IconX } from '../components/ui'
import { useToast } from '../components/ui'
import { t } from '../i18n'

function daysSince(dateStr?: string): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return t('today')
  if (diff < 30) return `${diff} ${t('days')}`
  const months = Math.floor(diff / 30)
  const days = diff % 30
  if (days === 0) return `${months} ${t('months')}`
  return `${months} ${t('months')} ${days} ${t('days')}`
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<'info' | 'password' | 'friends' | 'danger'>('info')
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)
  const checkTimer = useRef<any>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [friendNick, setFriendNick] = useState('')
  const [loadingFriends, setLoadingFriends] = useState(false)

  useEffect(() => {
    if (tab === 'friends') loadFriends()
  }, [tab])

  async function loadFriends() {
    setLoadingFriends(true)
    try {
      const [f, p] = await Promise.all([friendsApi.getAll(), friendsApi.getPending()])
      setFriends(f)
      setPending(p)
    } catch {} finally { setLoadingFriends(false) }
  }

  const handleNicknameChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
    setNickname(clean)
    clearTimeout(checkTimer.current)
    if (clean.length >= 3 && clean !== user?.nickname) {
      setNicknameStatus('checking')
      checkTimer.current = setTimeout(async () => {
        try {
          const { available } = await usersApi.checkNickname(clean)
          setNicknameStatus(available ? 'ok' : 'taken')
        } catch { setNicknameStatus('idle') }
      }, 600)
    } else { setNicknameStatus('idle') }
  }

  const handleSaveProfile = async () => {
    if (nicknameStatus === 'taken') { toast('Bu nickname band', 'error'); return }
    setSaving(true)
    try {
      const updated = await usersApi.update({ nickname })
      setUser({ ...user!, ...updated })
      toast('Saqlandi ✓', 'success')
    } catch (e: any) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!curPwd || newPwd.length < 6) { toast(t('newPassword'), 'error'); return }
    setSaving(true)
    try {
      await usersApi.changePassword(curPwd, newPwd)
      setCurPwd(''); setNewPwd('')
      toast('Parol o\'zgartirildi ✓', 'success')
    } catch (e: any) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Fayl 5MB dan oshmasligi kerak', 'error'); return }
    try {
      const updated = await usersApi.uploadAvatar(file)
      setUser({ ...user!, avatarUrl: updated.avatarUrl })
      toast('Rasm yangilandi ✓', 'success')
    } catch (e: any) { toast(e.message, 'error') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSendFriendRequest = async () => {
    if (!friendNick.trim()) return
    try {
      await friendsApi.sendRequest(friendNick.trim())
      toast('So\'rov yuborildi ✓', 'success')
      setFriendNick('')
    } catch (e: any) { toast(e.message, 'error') }
  }

  const handleAcceptFriend = async (id: string) => {
    try {
      await friendsApi.accept(id)
      toast('Do\'st qabul qilindi ✓', 'success')
      loadFriends()
    } catch (e: any) { toast(e.message, 'error') }
  }

  const handleRejectFriend = async (id: string) => {
    try {
      await friendsApi.reject(id)
      setPending(prev => prev.filter(p => p.id !== id))
    } catch (e: any) { toast(e.message, 'error') }
  }

  const gamesList = [
    { name: 'Imposter 🎭', played: user?.gamesPlayed ?? 0, wins: user?.wins ?? 0, xp: user?.xp ?? 0 },
  ]

  const TABS = [
    { key: 'info', label: `👤 ${t('infoTab')}` },
    { key: 'password', label: `🔐 ${t('passwordTab')}` },
    { key: 'friends', label: `👥 ${t('friendsSection')}` },
    { key: 'danger', label: t('dangerTab') },
  ] as const

  return (
    <Page maxWidth={820}>
      <div style={{ padding: '32px 0 60px' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: 20, gap: 6, fontSize: 13, textTransform: 'none', letterSpacing: 0, color: 'var(--muted2)' }}>
          <IconArrowLeft /> {t('back')}
        </button>

        {/* Profile header */}
        <div className="card animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar user={user} size={78} style={{ border: '2px solid var(--primary)', boxShadow: '0 0 18px var(--glow2)' }} />
            <button onClick={() => fileRef.current?.click()} title="Rasmni o'zgartirish" style={{
              position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
              borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg)',
              cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .15s',
            }}
              onMouseEnter={e => (e.currentTarget as any).style.transform = 'scale(1.15)'}
              onMouseLeave={e => (e.currentTarget as any).style.transform = 'scale(1)'}
            >✏️</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, letterSpacing: 3 }}>{user?.nickname}</h2>
            <p style={{ color: 'var(--muted2)', fontSize: 13, marginTop: 3 }}>{user?.email ?? user?.phoneNumber ?? 'Foydalanuvchi'}</p>
            <div style={{ marginTop: 10, maxWidth: 280 }}>
              <XPBar xp={user?.xp ?? 0} level={user?.level ?? 1} progress={user?.xpProgress} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{t('memberSince')}</div>
            <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15, marginTop: 4, fontFamily: 'var(--font-d)', letterSpacing: 2 }}>
              {daysSince(user?.createdAt)}
            </div>
          </div>
        </div>

        {/* Games list */}
        <div className="card animate-fade-up" style={{ marginBottom: 16, animationDelay: '.06s' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 14 }}>{t('gamesHistory')}</div>
          {gamesList.map((g, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                <div style={{ color: 'var(--muted2)', fontSize: 11, marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                  {g.played} o'yin · {g.wins} g'alaba · {g.xp} XP
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, color: 'var(--accent)', letterSpacing: 2 }}>
                  {g.played > 0 ? Math.round((g.wins / g.played) * 100) : 0}%
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{t('winRate')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="card animate-fade-up" style={{ animationDelay: '.12s' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab_ => (
              <button key={tab_.key} onClick={() => setTab(tab_.key as any)} style={{
                background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                padding: '11px 16px', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
                color: tab === tab_.key ? 'var(--text)' : 'var(--muted2)',
                borderBottom: `2px solid ${tab === tab_.key ? 'var(--accent)' : 'transparent'}`,
                transition: 'all .16s', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>{tab_.label}</button>
            ))}
          </div>

          {/* Info tab */}
          {tab === 'info' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>NICKNAME</label>
                <input className={`input ${nicknameStatus === 'taken' ? 'error' : ''}`} value={nickname} onChange={e => handleNicknameChange(e.target.value)} maxLength={20} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: nicknameStatus === 'ok' ? 'var(--green)' : nicknameStatus === 'taken' ? 'var(--accent)' : 'var(--muted)' }}>
                    {nicknameStatus === 'ok' ? t('nicknameAvailable') : nicknameStatus === 'taken' ? t('nicknameTaken') : nicknameStatus === 'checking' ? t('nicknameChecking') : t('nicknameCooldown')}
                  </span>
                  <span style={{ color: nickname.length >= 20 ? 'var(--accent)' : 'var(--muted)' }}>{nickname.length}/20</span>
                </div>
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>{t('emailField')}</label>
                <input className="input" value={user?.email ?? user?.phoneNumber ?? ''} disabled style={{ opacity: .5 }} />
              </div>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving || nicknameStatus === 'taken'}>
                {saving ? <><Spinner size={14} /> Saqlanmoqda...</> : t('save').toUpperCase()}
              </button>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div className="animate-fade-in">
              <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>Kamida 6 belgili parol. Raqamlar ham qabul qilinadi.</p>
              {[
                [t('currentPassword'), curPwd, setCurPwd, 'Joriy parol'],
                [t('newPassword'), newPwd, setNewPwd, 'Kamida 6 belgi'],
              ].map(([label, val, setter, ph], i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 7, letterSpacing: .5 }}>{label as string}</label>
                  <input type="password" className="input" placeholder={ph as string} value={val as string} onChange={e => (setter as any)(e.target.value)} />
                </div>
              ))}
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
                {saving ? <><Spinner size={14} /> Saqlanmoqda...</> : t('changePassword').toUpperCase()}
              </button>
            </div>
          )}

          {/* Friends tab */}
          {tab === 'friends' && (
            <div className="animate-fade-in">
              {/* Add friend */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', marginBottom: 8, letterSpacing: .5 }}>{t('addFriend').toUpperCase()}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" placeholder="Nickname..." value={friendNick} onChange={e => setFriendNick(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendFriendRequest()} style={{ flex: 1 }} />
                  <button className="btn btn-primary" onClick={handleSendFriendRequest} style={{ flexShrink: 0, gap: 6 }}>
                    <IconUserPlus /> {t('friendRequest')}
                  </button>
                </div>
              </div>

              {/* Pending requests */}
              {pending.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>
                    KELGAN SO'ROVLAR ({pending.length})
                  </div>
                  {pending.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid rgba(139,0,0,.2)', marginBottom: 8 }}>
                      <Avatar user={p.requester} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.requester.nickname}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Do'stlik so'rovi</div>
                      </div>
                      <button className="btn btn-green" style={{ padding: '6px 12px', gap: 5, fontSize: 11 }} onClick={() => handleAcceptFriend(p.id)}>
                        <IconCheck /> {t('accept')}
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleRejectFriend(p.id)}>
                        <IconX />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Friends list */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10 }}>
                {t('friendsSection').toUpperCase()} ({friends.length})
              </div>
              {loadingFriends ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spinner /></div>
              ) : friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted2)', fontSize: 13 }}>{t('noFriends')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {friends.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <Avatar user={f} size={38} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{f.nickname}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(f.since).toLocaleDateString('uz')} dan do'st
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Danger tab */}
          {tab === 'danger' && (
            <div className="animate-fade-in">
              <div style={{ background: 'rgba(139,0,0,.06)', border: '1px solid rgba(139,0,0,.18)', borderRadius: 8, padding: 20 }}>
                <h4 style={{ fontFamily: 'var(--font-d)', letterSpacing: 2, marginBottom: 8, color: 'var(--accent)', fontSize: 18 }}>{t('deleteAccount').toUpperCase()}</h4>
                <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>{t('deleteWarning')}</p>
                <button className="btn btn-danger">{t('deleteAccount')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
