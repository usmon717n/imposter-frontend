// src/pages/OXGame.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roomsApi } from '../services/api'
import { socket } from '../services/socket'
import { useAuthStore, useGameStore } from '../store'
import { Avatar, BgOrbs, Spinner } from '../components/ui'
import { useToast } from '../components/ui'
import { playSound } from '../services/sounds'

type Cell = 'X' | 'O' | null
type GameStatus = 'waiting' | 'playing' | 'won' | 'draw'

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],          // diagonals
]

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

export default function OXGame() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuthStore()

  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<any[]>([])

  // Game state
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [mySymbol, setMySymbol] = useState<'X' | 'O'>('X')
  const [currentTurn, setCurrentTurn] = useState<string>('') // userId whose turn it is
  const [status, setStatus] = useState<GameStatus>('waiting')
  const [winLine, setWinLine] = useState<number[]>([])
  const [winnerUserId, setWinnerUserId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [roundCount, setRoundCount] = useState(0)
  const [rematchVotes, setRematchVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadRoom()
  }, [code])

  const loadRoom = async () => {
    try {
      const r = code ? await roomsApi.getByCode(code) : null
      if (!r) { navigate('/room'); return }
      setRoom(r)
      setPlayers(r.players || [])

      socket.connect()
      await socket.joinRoom(r.roomCode)

      // If 2 players already joined, start
      if (r.players?.length >= 2) {
        initGame(r.players, r.hostId)
      }
    } catch (e: any) {
      toast(e.message, 'error')
      navigate('/room')
    } finally { setLoading(false) }
  }

  const initGame = (playerList: any[], hostId: string) => {
    // Host = X, other = O
    const isHost = playerList.find((p: any) => p.userId === hostId)?.userId === user?.id
    setMySymbol(isHost ? 'X' : 'O')
    setCurrentTurn(hostId) // host goes first (X)
    setStatus('playing')
    setBoard(Array(9).fill(null))
    setWinLine([])
    setWinnerUserId(null)
    setRematchVotes(new Set())
  }

  useEffect(() => {
    const unsubs = [
      socket.on('player_joined', ({ player }: any) => {
        setPlayers(prev => {
          const updated = prev.some((p: any) => p.userId === player.userId)
            ? prev
            : [...prev, player]
          // Start game when 2 players joined
          if (updated.length >= 2 && room) {
            initGame(updated, room.hostId)
          }
          return updated
        })
      }),

      socket.on('player_left', ({ userId }: any) => {
        setPlayers(prev => prev.filter((p: any) => p.userId !== userId))
        setStatus('waiting')
        toast('O\'yinchi xonadan chiqdi', 'info')
      }),

      socket.on('ox_move', ({ userId, index }: any) => {
        if (userId === user?.id) return // own move already applied
        setBoard(prev => {
          const next = [...prev]
          const symbol = userId === room?.hostId ? 'X' : 'O'
          next[index] = symbol
          const result = checkWinner(next)
          if (result) {
            setWinLine(result.line)
            setWinnerUserId(userId)
            setStatus('won')
            setScores(s => ({ ...s, [userId]: (s[userId] || 0) + 1 }))
            playSound('game_end')
          } else if (next.every(Boolean)) {
            setStatus('draw')
          }
          return next
        })
        setCurrentTurn(user?.id || '') // my turn next
      }),

      socket.on('ox_reset', () => {
        setBoard(Array(9).fill(null))
        setWinLine([])
        setWinnerUserId(null)
        setStatus('playing')
        setRematchVotes(new Set())
        setRoundCount(c => c + 1)
        // Alternate first turn
        setCurrentTurn(prev => {
          const opponent = players.find((p: any) => p.userId !== prev)?.userId || prev
          return opponent
        })
      }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [room, players, user])

  const handleCellClick = (index: number) => {
    if (!room) return
    if (status !== 'playing') return
    if (currentTurn !== user?.id) return
    if (board[index]) return

    const newBoard = [...board]
    newBoard[index] = mySymbol
    setBoard(newBoard)

    // Check winner
    const result = checkWinner(newBoard)
    if (result) {
      setWinLine(result.line)
      setWinnerUserId(user?.id || null)
      setStatus('won')
      setScores(s => ({ ...s, [user?.id || '']: (s[user?.id || ''] || 0) + 1 }))
      playSound('game_end')
    } else if (newBoard.every(Boolean)) {
      setStatus('draw')
    } else {
      const opponent = players.find((p: any) => p.userId !== user?.id)
      if (opponent) setCurrentTurn(opponent.userId)
    }

    // Send to opponent
    socket.oxMove(room.id, index)
  }

  const handleRematch = () => {
    if (!room) return
    socket.oxReset(room.id)
  }

  const handleLeave = async () => {
    if (room) await socket.leaveRoom(room.id)
    navigate('/')
  }

  const opponent = players.find((p: any) => p.userId !== user?.id)
  const myPlayer = players.find((p: any) => p.userId === user?.id)
  const isMyTurn = currentTurn === user?.id && status === 'playing'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <BgOrbs />
      <Spinner size={32} />
      <p style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Xona yuklanmoqda...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 40px', position: 'relative' }}>
      <BgOrbs />
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, letterSpacing: 6, marginBottom: 4 }}>
            OX <span style={{ color: 'var(--accent)' }}>O'YINI</span>
          </div>
          {room && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>
              XONA: {room.roomCode}
            </div>
          )}
        </div>

        {/* Players bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          {/* Me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Avatar user={myPlayer} size={40} style={{ border: `2px solid ${mySymbol === 'X' ? '#ef4444' : '#3b82f6'}` }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{myPlayer?.nickname ?? user?.nickname} <span style={{ color: 'var(--muted2)', fontSize: 11 }}>(Siz)</span></div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: mySymbol === 'X' ? '#ef4444' : '#3b82f6', letterSpacing: 2 }}>{mySymbol}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 28, color: 'var(--accent)', marginLeft: 'auto' }}>
              {scores[user?.id || ''] ?? 0}
            </div>
          </div>

          <div style={{ padding: '0 16px', color: 'var(--muted)', fontFamily: 'var(--font-d)', fontSize: 18 }}>VS</div>

          {/* Opponent */}
          {opponent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
              <Avatar user={opponent} size={40} style={{ border: `2px solid ${mySymbol === 'X' ? '#3b82f6' : '#ef4444'}` }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{opponent.nickname}</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, color: mySymbol === 'X' ? '#3b82f6' : '#ef4444', letterSpacing: 2 }}>{mySymbol === 'X' ? 'O' : 'X'}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 28, color: 'var(--accent)', marginRight: 'auto' }}>
                {scores[opponent.userId] ?? 0}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 13 }}>
              <Spinner size={14} /> Kutilmoqda...
            </div>
          )}
        </div>

        {/* Status bar */}
        {status === 'playing' && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{
              background: isMyTurn ? 'rgba(139,0,0,.15)' : 'rgba(50,50,50,.4)',
              border: `1px solid ${isMyTurn ? 'rgba(139,0,0,.4)' : 'var(--border)'}`,
              borderRadius: 20, padding: '6px 18px', fontSize: 13,
              color: isMyTurn ? 'var(--accent)' : 'var(--muted2)',
              fontFamily: 'var(--font-mono)', letterSpacing: 1,
              display: 'inline-block',
            }}>
              {isMyTurn ? '⚡ SIZNING NAVBATINGIZ' : `⏳ ${opponent?.nickname ?? '...'} o'ylayapti`}
            </span>
          </div>
        )}

        {/* Game Board */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          padding: 16, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, marginBottom: 16,
          boxShadow: '0 0 40px rgba(139,0,0,.1)',
        }}>
          {board.map((cell, i) => {
            const isWinCell = winLine.includes(i)
            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={!!cell || !isMyTurn || status !== 'playing'}
                style={{
                  aspectRatio: '1',
                  background: isWinCell
                    ? 'rgba(139,0,0,.15)'
                    : cell
                    ? 'var(--surface2)'
                    : 'var(--surface3)',
                  border: `2px solid ${isWinCell ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12,
                  cursor: !cell && isMyTurn && status === 'playing' ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(32px, 8vw, 56px)',
                  fontFamily: 'var(--font-d)', letterSpacing: 2,
                  color: cell === 'X' ? '#ef4444' : '#3b82f6',
                  transition: 'all .15s',
                  boxShadow: isWinCell ? '0 0 16px var(--glow)' : 'none',
                  textShadow: cell === 'X' ? '0 0 16px rgba(239,68,68,.5)' : cell === 'O' ? '0 0 16px rgba(59,130,246,.5)' : 'none',
                  transform: cell && isWinCell ? 'scale(1.08)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!cell && isMyTurn && status === 'playing') {
                    (e.currentTarget as any).style.background = 'var(--surface2)'
                    ;(e.currentTarget as any).style.borderColor = 'var(--primary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!cell) {
                    (e.currentTarget as any).style.background = 'var(--surface3)'
                    ;(e.currentTarget as any).style.borderColor = 'var(--border)'
                  }
                }}
              >
                {cell}
              </button>
            )
          })}
        </div>

        {/* Result overlay */}
        {(status === 'won' || status === 'draw') && (
          <div className="animate-fade-up" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 16,
            boxShadow: '0 0 40px rgba(0,0,0,.5)',
          }}>
            {status === 'draw' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🤝</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, letterSpacing: 4, color: 'var(--muted2)' }}>DURRANG!</div>
              </>
            ) : winnerUserId === user?.id ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🏆</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, letterSpacing: 4, color: 'var(--green)', textShadow: '0 0 24px rgba(34,197,94,.4)' }}>SIZ YUTDINGIZ!</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 10 }}>😔</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, letterSpacing: 4, color: 'var(--accent)' }}>YUTQAZDINGIZ</div>
                <div style={{ color: 'var(--muted2)', fontSize: 14, marginTop: 6 }}>{opponent?.nickname} g'alaba qozondi</div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleRematch} style={{ padding: '10px 24px' }}>
                QAYTA O'YNASH →
              </button>
              <button className="btn btn-outline" onClick={handleLeave}>
                CHIQISH
              </button>
            </div>
          </div>
        )}

        {/* Waiting state */}
        {status === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted2)', fontSize: 14 }}>
            <Spinner size={24} />
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Ikkinchi o'yinchi kutilmoqda...
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2 }}>
              XONA KODI: {room?.roomCode}
            </div>
          </div>
        )}

        {/* Leave button */}
        {status !== 'won' && status !== 'draw' && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-ghost" onClick={handleLeave} style={{ fontSize: 12 }}>
              Xonadan chiqish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
