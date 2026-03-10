'use client'
import { useCallback, useRef } from 'react'

type SoundName = 'buzz' | 'correct' | 'wrong' | 'tick' | 'fanfare' | 'double' | 'timeup'

export function useSound(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return ctxRef.current
  }, [])

  const play = useCallback((name: SoundName) => {
    if (!enabled || typeof window === 'undefined') return
    try {
      const ctx = getCtx()

      switch (name) {
        case 'buzz': {
          // Short sharp buzz
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = 'sawtooth'
          o.frequency.setValueAtTime(220, ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
          g.gain.setValueAtTime(0.4, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
          o.start(); o.stop(ctx.currentTime + 0.18)
          break
        }
        case 'correct': {
          // Ascending happy ding
          const notes = [523, 659, 784, 1047]
          notes.forEach((freq, i) => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.type = 'sine'
            o.frequency.value = freq
            const t = ctx.currentTime + i * 0.1
            g.gain.setValueAtTime(0.3, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
            o.start(t); o.stop(t + 0.25)
          })
          break
        }
        case 'wrong': {
          // Low descending fail
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = 'square'
          o.frequency.setValueAtTime(300, ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35)
          g.gain.setValueAtTime(0.25, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
          o.start(); o.stop(ctx.currentTime + 0.35)
          break
        }
        case 'tick': {
          // Metronome click
          const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
          const data = buf.getChannelData(0)
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200)
          const src = ctx.createBufferSource()
          const g   = ctx.createGain()
          src.buffer = buf; src.connect(g); g.connect(ctx.destination)
          g.gain.value = 0.3
          src.start()
          break
        }
        case 'timeup': {
          // Alarm beeps
          [0, 0.18, 0.36].forEach(delay => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.type = 'square'
            o.frequency.value = 880
            const t = ctx.currentTime + delay
            g.gain.setValueAtTime(0.3, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
            o.start(t); o.stop(t + 0.14)
          })
          break
        }
        case 'fanfare': {
          // Victory fanfare
          const melody = [523, 523, 523, 659, 523, 659, 784]
          const durations = [0.12, 0.12, 0.12, 0.35, 0.12, 0.12, 0.5]
          let t = ctx.currentTime
          melody.forEach((freq, i) => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.type = 'triangle'
            o.frequency.value = freq
            g.gain.setValueAtTime(0.3, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + durations[i])
            o.start(t); o.stop(t + durations[i])
            t += durations[i] + 0.02
          })
          break
        }
        case 'double': {
          // Power-up sound
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.type = 'sine'
          o.frequency.setValueAtTime(440, ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2)
          o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.35)
          g.gain.setValueAtTime(0.3, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
          o.start(); o.stop(ctx.currentTime + 0.4)
          break
        }
      }
    } catch {
      // Audio may be blocked before user interaction — silent fail is fine
    }
  }, [enabled, getCtx])

  return { play }
}
