'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRoom, joinRoom } from '../../lib/rooms'
import styles from './page.module.css'

const COLORS = [
  '#C8102E','#003580','#FFD700','#00e676',
  '#00e5ff','#ff6d00','#e040fb','#ff1744',
]

function JoinForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [code,     setCode]    = useState(params.get('code') ?? '')
  const [name,     setName]    = useState('')
  const [color,    setColor]   = useState(COLORS[0])
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')

  const handleJoin = async () => {
    const trimCode = code.trim().toUpperCase()
    const trimName = name.trim()
    if (!trimCode) { setError('Enter a room code'); return }
    if (!trimName) { setError('Enter your name'); return }

    setLoading(true)
    setError('')
    try {
      const room = await getRoom(trimCode)
      if (!room) { setError(`Room "${trimCode}" not found. Check the code and try again.`); return }
      if (room.status === 'ended') { setError('That game has already ended.'); return }

      const contestant = await joinRoom(trimCode, trimName, color)
      // Save contestant ID so the play page knows who we are
      localStorage.setItem('sow-contestant', JSON.stringify({ id: contestant.id, name: trimName, color, roomCode: trimCode }))
      router.push(`/play?code=${trimCode}`)
    } catch (e: any) {
      setError(e?.message?.includes('duplicate') ? 'That name is already taken in this room.' : 'Failed to join. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.centered}>
      <div className={styles.card}>
        <div className={styles.icon}>🎮</div>
        <h1 className={styles.title}>Join Quiz Room</h1>
        <p className={styles.sub}>Enter the code your host shared with you</p>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="SOW-XXX"
            maxLength={7}
            className={styles.codeInput}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoCapitalize="characters"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Your Name / Team</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Team Eagles"
            maxLength={30}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label className="form-label">Pick a Colour</label>
          <div className={styles.colorRow}>
            {COLORS.map(c => (
              <button
                key={c}
                className={`${styles.colorDot} ${color === c ? styles.selected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                type="button"
              />
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className="btn btn-primary btn-lg"
          onClick={handleJoin}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Joining…' : '🚀 Join Room'}
        </button>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <JoinForm />
    </Suspense>
  )
}
