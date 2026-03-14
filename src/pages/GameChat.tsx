// src/pages/GameChat.tsx
import React, { useState, useRef, useEffect } from 'react'
import { Room } from '../services/api'
import { useAuthStore, useGameStore } from '../store'
import { useGameSocket } from '../hooks/useGame'
import { Avatar, Countdown, XPPopup, IconEye } from '../components/ui'
import { useToast } from '../components/ui'
import { t } from '../i18n'

const REACTIONS = ['👍', '😂', '😮', '🔥', '❤️', '😱']

export default function GameChat({ room, onLeave }: { room: Room; onLeave: () => void }) {
  const { user } = useAuthStore()
  const game = useGameStore()
  const { sendMessage, skipTurn, castVote, triggerVoting, addReaction } = useGameSocket(room.id)
  const toast = useToast()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null)
  const [showXp, setShowXp] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMyTurn = game.currentTurnUserId === user?.id && !game.isSpectator
  const activePlayers = game.players.filter(p => !p.isEliminated)
  const isVoting = game.phase === 'voting'

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [game.messages])

  useEffect(() => {
    if (isMyTurn && inputRef.current) inputRef.current.focus()
  }, [isMyTurn])

  useEffect(() => {
    if (game.xpResult) setShowXp(true)
  }, [game.xpResult])

  const handleSend = async () => {
    if (!input.trim() || !isMyTurn) return
    setSending(true)
    try { await sendMessage(input.trim()); setInput('') }
    catch (e: any) { toast(e.message, 'error') }
    finally { setSending(false) }
  }

  const handleVote = async (targetPlayerId: string) => {
    try { await castVote(targetPlayerId) }
    catch (e: any) { toast(e.message, 'error') }
  }

  const handleReaction = (msgId: string, reaction: string) => {
    addReaction(msgId, reaction)
    setReactionMsgId(null)
  }

  const currentTurnPlayer = game.players.find(p => p.userId === game.currentTurnUserId)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 60 }}>

      {/* XP Popup */}
      {showXp && game.xpResult && (
        <XPPopup
          xpGained={game.xpResult.xpGained}
          leveledUp={game.xpResult.leveledUp}
          newLevel={game.xpResult.newLevel}
          onClose={() => setShowXp(false)}
        />
      )}

      {/* Top bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{t('time')}</span>
          <span style={{ fontFamily: 'var(--font-d)', fontSize: 22, letterSpacing: 2 }}>
            <Countdown endsAt={game.gameEndsAt} danger={60} />
          </span>
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          {game.isSpectator ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(80,80,80,.2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
              <IconEye /> {t('spectatorMode')}
            </span>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{t('yourWord')} </span>
              <span style={{ fontFamily: 'var(--font-d)', fontSize: 16, letterSpacing: 3, color: game.isImposter ? 'var(--accent)' : 'var(--green)' }}>{game.myWord}</span>
              {game.isImposter && <span className="badge badge-red" style={{ marginLeft: 8 }}>IMPOSTER</span>}
            </>
          )}
        </div>

        {/* Turn avatars */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {activePlayers.slice(0, 6).map(p => (
            <div key={p.userId} style={{ position: 'relative' }} title={p.nickname}>
              <Avatar user={p} size={28} style={{
                border: `2px solid ${p.userId === game.currentTurnUserId ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: p.userId === game.currentTurnUserId ? '0 0 8px var(--glow)' : 'none',
                animation: p.userId === game.currentTurnUserId ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }} />
            </div>
          ))}
        </div>

        {!isVoting && !game.isSpectator && (
          <button className="btn btn-outline" style={{ fontSize: 10, padding: '6px 12px', flexShrink: 0 }} onClick={triggerVoting}>
            🗳️ {t('vote')}
          </button>
        )}
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '6px 10px', flexShrink: 0 }} onClick={onLeave}>{t('leaveRoom')}</button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 175, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>{t('waitingPlayers')}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {game.players.map(p => (
              <div key={p.userId} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                borderRadius: 6, marginBottom: 3,
                background: p.userId === game.currentTurnUserId ? 'rgba(139,0,0,.08)' : 'transparent',
                border: `1px solid ${p.userId === game.currentTurnUserId ? 'rgba(139,0,0,.2)' : 'transparent'}`,
                opacity: p.isEliminated ? 0.4 : 1,
              }}>
                <div style={{ position: 'relative' }}>
                  <Avatar user={p} size={24} />
                  {p.isEliminated && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>💀</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: p.isEliminated ? 'line-through' : 'none' }}>
                    {p.nickname}{p.userId === user?.id ? ' (siz)' : ''}
                  </div>
                  {p.userId === game.currentTurnUserId && !p.isEliminated && (
                    <div style={{ fontSize: 8, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>NAVBAT</div>
                  )}
                </div>

                {isVoting && p.userId !== user?.id && !p.isEliminated && (
                  <button onClick={() => handleVote(p.userId)}
                    className={game.myVote === p.userId ? 'btn btn-danger' : 'btn btn-outline'}
                    style={{ padding: '3px 6px', fontSize: 9, flexShrink: 0 }}>
                    {game.myVote === p.userId ? '✓' : '🗳'}
                    {game.voteCounts[p.userId] ? ` ${game.voteCounts[p.userId]}` : ''}
                  </button>
                )}
              </div>
            ))}
          </div>

          {isVoting && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'rgba(139,0,0,.07)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: 1, textAlign: 'center' }}>
                🗳️ OVOZ BERISH<br /><span style={{ color: 'var(--muted2)' }}>IXTIYORIY</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

          {/* Turn indicator */}
          <div style={{ padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {game.isSpectator ? (
              <span style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>{t('spectatorHint')}</span>
            ) : (
              <span style={{
                background: isMyTurn ? 'rgba(139,0,0,.12)' : 'rgba(50,50,50,.3)',
                border: `1px solid ${isMyTurn ? 'rgba(139,0,0,.3)' : 'var(--border)'}`,
                borderRadius: 20, padding: '4px 14px', fontSize: 11,
                color: isMyTurn ? 'var(--accent)' : 'var(--muted2)',
                fontFamily: 'var(--font-mono)', letterSpacing: 1,
              }}>
                {isMyTurn ? `⚡ ${t('yourTurn')}` : `⏳ ${currentTurnPlayer?.nickname ?? '...'} ${t('waitingTurn')}`}
              </span>
            )}
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {game.messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 20 }}>
                O'yin boshlandi. Navbat tartibida yozing...
              </div>
            )}
            {game.messages.map((msg, i) => {
              if (msg.isSystem) return (
                <div key={msg.id} style={{ textAlign: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)', background: 'var(--surface2)', padding: '3px 12px', borderRadius: 20 }}>
                    {msg.message}
                  </span>
                </div>
              )
              const isMe = msg.userId === user?.id
              const reactionCounts: Record<string, number> = {}
              const myReactions: Set<string> = new Set()
              if (msg.reactions) {
                Object.entries(msg.reactions).forEach(([emoji, users]) => {
                  if (users.length > 0) reactionCounts[emoji] = users.length
                  if (users.includes(user?.id ?? '')) myReactions.add(emoji)
                })
              }

              return (
                <div key={msg.id} className="animate-msg-in" style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 9 }}>
                  <Avatar user={{ nickname: msg.nickname, avatarUrl: msg.avatarUrl }} size={30} style={{ flexShrink: 0, alignSelf: 'flex-end' }} />
                  <div style={{ maxWidth: '68%' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted2)', marginBottom: 3, textAlign: isMe ? 'right' : 'left', fontFamily: 'var(--font-mono)' }}>
                      {msg.nickname} · {new Date(msg.timestamp).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          background: isMe ? 'var(--primary)' : 'var(--surface2)',
                          border: `1px solid ${isMe ? 'rgba(255,255,255,.07)' : 'var(--border)'}`,
                          borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          padding: '9px 13px', fontSize: 14, lineHeight: 1.5, cursor: 'pointer',
                        }}
                        onMouseEnter={() => setReactionMsgId(msg.id)}
                        onMouseLeave={() => setTimeout(() => setReactionMsgId(id => id === msg.id ? null : id), 300)}
                      >
                        {msg.message}
                      </div>

                      {/* Reaction picker */}
                      {reactionMsgId === msg.id && (
                        <div style={{
                          position: 'absolute', [isMe ? 'right' : 'left']: 0, bottom: '100%', marginBottom: 4,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 24, padding: '6px 10px', display: 'flex', gap: 6,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10,
                          animation: 'fadeUp 0.15s ease',
                        }}>
                          {REACTIONS.map(r => (
                            <button key={r} onClick={() => handleReaction(msg.id, r)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '2px 4px', borderRadius: 6, transition: 'transform .1s' }}
                              onMouseEnter={e => (e.currentTarget as any).style.transform = 'scale(1.3)'}
                              onMouseLeave={e => (e.currentTarget as any).style.transform = 'scale(1)'}
                            >{r}</button>
                          ))}
                        </div>
                      )}

                      {/* Reaction counts */}
                      {Object.keys(reactionCounts).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                              className={`reaction-btn ${myReactions.has(emoji) ? 'active' : ''}`}>
                              {emoji} <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 8 }}>
            {game.isSpectator ? (
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconEye /> {t('spectatorHint')}
              </div>
            ) : isMyTurn && !isVoting ? (
              <>
                <input ref={inputRef} className="input" placeholder={t('typeMessage')} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} maxLength={500} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || sending} style={{ padding: '0 18px', flexShrink: 0 }}>
                  {sending ? '...' : '→'}
                </button>
                <button className="btn btn-ghost" onClick={() => skipTurn()} style={{ flexShrink: 0, fontSize: 11, padding: '0 10px' }}>
                  {t('skip')}
                </button>
              </>
            ) : isVoting ? (
              <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', color: 'var(--muted2)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                🗳️ Chap paneldan ovoz bering
              </div>
            ) : (
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                ⏳ {currentTurnPlayer?.nickname}ning navbati...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
