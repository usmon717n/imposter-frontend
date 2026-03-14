// src/services/socket.ts
import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './api'

const WS_URL = import.meta.env.VITE_WS_URL || 'https://perfect-serenity-production.up.railway.app'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) return
    this.socket = io(`${WS_URL}/game`, {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    this.socket.on('connect', () => console.log('🔌 Socket connected'))
    this.socket.on('disconnect', (reason) => console.log('🔌 Disconnected:', reason))
    this.socket.on('connect_error', (e) => console.error('Socket error:', e.message))
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  on(event: string, handler: (...args: any[]) => void): () => void {
    this.socket?.on(event, handler)
    return () => this.socket?.off(event, handler)
  }

  emit(event: string, data: any): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected' })
        return
      }
      this.socket.emit(event, data, (res: any) => resolve(res ?? { success: true }))
      setTimeout(() => resolve({ success: false, error: 'Timeout' }), 8000)
    })
  }

  // Room
  joinRoom(roomCode: string) { return this.emit('join_room', { roomCode }) }
  leaveRoom(roomId: string) { return this.emit('leave_room', { roomId }) }

  // Imposter game
  startGame(roomId: string) { return this.emit('start_game', { roomId }) }
  sendMessage(roomId: string, message: string) { return this.emit('send_message', { roomId, message }) }
  skipTurn(roomId: string) { this.socket?.emit('skip_turn', { roomId }) }
  castVote(roomId: string, targetUserId: string) { return this.emit('cast_vote', { roomId, targetUserId }) }
  startVoting(roomId: string) { return this.emit('start_voting', { roomId }) }
  addReaction(roomId: string, messageId: string, reaction: string) {
    return this.emit('add_reaction', { roomId, messageId, reaction })
  }

  // OX game
  oxMove(roomId: string, index: number) { return this.emit('ox_move', { roomId, index }) }
  oxReset(roomId: string) { return this.emit('ox_reset', { roomId }) }
}

export const socket = new SocketService()
