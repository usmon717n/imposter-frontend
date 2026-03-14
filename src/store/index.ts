// src/store/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Room } from '../services/api'
import { setLang, type Lang } from '../i18n'

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (u: User | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
  setLanguage: (lang: Lang) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null }),
      setLanguage: (lang: Lang) => {
        setLang(lang)
        const user = get().user
        if (user) set({ user: { ...user, language: lang } })
      },
    }),
    { name: 'imposter-auth', partialize: (s) => ({ user: s.user }) }
  )
)

// ─── Game Store ───────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  userId: string
  nickname: string
  avatarUrl?: string
  message: string
  timestamp: string
  isSystem?: boolean
  reactions?: Record<string, string[]>
}

export interface GamePlayer {
  userId: string
  nickname: string
  avatarUrl?: string
  turnOrder: number
  isEliminated?: boolean
  isConnected?: boolean
}

interface XpResult {
  userId: string
  xpGained: number
  newXp: number
  newLevel: number
  leveledUp: boolean
}

interface GameState {
  room: Room | null
  phase: 'idle' | 'lobby' | 'word_reveal' | 'playing' | 'voting' | 'result'
  myWord: string | null
  isImposter: boolean
  isSpectator: boolean
  players: GamePlayer[]
  messages: ChatMessage[]
  currentTurnUserId: string | null
  turnEndsAt: string | null
  gameEndsAt: string | null
  voteCounts: Record<string, number>
  myVote: string | null
  winner: 'players' | 'imposter' | null
  imposterUserId: string | null
  imposterNickname: string | null
  commonWord: string | null
  imposterWord: string | null
  eliminatedPlayerId: string | null
  xpResult: XpResult | null

  setRoom: (r: Room | null) => void
  setPhase: (p: GameState['phase']) => void
  setGameStarted: (data: { word: string; isImposter: boolean; players: GamePlayer[]; durationSeconds: number; gameEndsAt?: string }) => void
  setGameEndsAt: (endsAt: string) => void
  addMessage: (m: ChatMessage) => void
  addSystemMessage: (text: string) => void
  updateReaction: (messageId: string, reactions: Record<string, string[]>) => void
  setTurn: (userId: string, endsAt: string) => void
  setVoteCounts: (counts: Record<string, number>) => void
  setMyVote: (id: string) => void
  setGameEnded: (data: { winner: 'players' | 'imposter'; imposterUserId: string; imposterNickname: string; commonWord: string; imposterWord: string }) => void
  eliminatePlayer: (playerId: string) => void
  setPlayerConnected: (userId: string, connected: boolean) => void
  addPlayer: (p: GamePlayer) => void
  removePlayer: (userId: string) => void
  setXpResult: (r: XpResult) => void
  reset: () => void
}

const initialGameState = {
  room: null, phase: 'idle' as const, myWord: null, isImposter: false,
  isSpectator: false, players: [], messages: [],
  currentTurnUserId: null, turnEndsAt: null, gameEndsAt: null,
  voteCounts: {}, myVote: null, winner: null,
  imposterUserId: null, imposterNickname: null,
  commonWord: null, imposterWord: null, eliminatedPlayerId: null, xpResult: null,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialGameState,
  setRoom: (room) => set({ room }),
  setGameEndsAt: (gameEndsAt) => set({ gameEndsAt }),
  setPhase: (phase) => set({ phase }),
  setGameStarted: ({ word, isImposter, players, durationSeconds, gameEndsAt }) => set({
    myWord: word, isImposter, players, phase: 'word_reveal',
    gameEndsAt: gameEndsAt || new Date(Date.now() + durationSeconds * 1000).toISOString(),
    messages: [], voteCounts: {}, myVote: null, winner: null, isSpectator: false,
  }),
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  addSystemMessage: (text) => set(s => ({
    messages: [...s.messages, {
      id: Date.now().toString(), userId: 'system', nickname: 'Tizim',
      message: text, timestamp: new Date().toISOString(), isSystem: true,
    }]
  })),
  updateReaction: (messageId, reactions) => set(s => ({
    messages: s.messages.map(m => m.id === messageId ? { ...m, reactions } : m)
  })),
  setTurn: (userId, endsAt) => set({ currentTurnUserId: userId, turnEndsAt: endsAt }),
  setVoteCounts: (voteCounts) => set({ voteCounts }),
  setMyVote: (id) => set({ myVote: id }),
  setGameEnded: (data) => set({ ...data, phase: 'result' }),
  eliminatePlayer: (playerId) => set(s => ({
    eliminatedPlayerId: playerId,
    players: s.players.map(p => p.userId === playerId ? { ...p, isEliminated: true } : p),
  })),
  setPlayerConnected: (userId, connected) => set(s => ({
    players: s.players.map(p => p.userId === userId ? { ...p, isConnected: connected } : p)
  })),
  addPlayer: (p) => set(s => ({
    players: s.players.some(x => x.userId === p.userId) ? s.players : [...s.players, p]
  })),
  removePlayer: (userId) => set(s => ({ players: s.players.filter(p => p.userId !== userId) })),
  setXpResult: (xpResult) => set({ xpResult }),
  reset: () => set(initialGameState),
}))
