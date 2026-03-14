// src/services/sounds.ts
type SoundType = 'your_turn' | 'game_start' | 'game_end' | 'xp_gain' | 'notification' | 'vote'

const ctx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null

function beep(freq: number, duration: number, vol = 0.3, type: OscillatorType = 'sine') {
  if (!ctx) return
  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = freq
    oscillator.type = type
    gainNode.gain.setValueAtTime(vol, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {}
}

export function playSound(type: SoundType) {
  if (!ctx) return
  // Resume context on user interaction
  if (ctx.state === 'suspended') ctx.resume()

  switch (type) {
    case 'your_turn':
      // Ascending ping
      beep(440, 0.15, 0.25)
      setTimeout(() => beep(660, 0.2, 0.3), 150)
      setTimeout(() => beep(880, 0.25, 0.35), 300)
      break
    case 'game_start':
      // Dramatic start
      beep(220, 0.1, 0.2, 'square')
      setTimeout(() => beep(330, 0.1, 0.2, 'square'), 120)
      setTimeout(() => beep(440, 0.1, 0.2, 'square'), 240)
      setTimeout(() => beep(660, 0.3, 0.3, 'square'), 360)
      break
    case 'game_end':
      // Dramatic end
      beep(880, 0.2, 0.3)
      setTimeout(() => beep(660, 0.2, 0.3), 200)
      setTimeout(() => beep(440, 0.3, 0.3), 400)
      setTimeout(() => beep(220, 0.5, 0.25), 700)
      break
    case 'xp_gain':
      // Happy chime
      beep(523, 0.1, 0.2)
      setTimeout(() => beep(659, 0.1, 0.2), 100)
      setTimeout(() => beep(784, 0.2, 0.3), 200)
      break
    case 'notification':
      // Soft ping
      beep(523, 0.15, 0.15)
      setTimeout(() => beep(659, 0.2, 0.2), 150)
      break
    case 'vote':
      beep(330, 0.1, 0.15, 'square')
      break
  }
}
