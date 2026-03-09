'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoom, subscribeToRoom, updateRoom, getContestants, Room, Contestant } from '@/lib/rooms'
import styles from './page.module.css'

interface MyInfo { id: string; name: string; color: string; roomCode: string }

function PlayScreen() {
  const params  = useSearchParams()
  const router  = useRouter()
  const code    = params.get('code') ?? ''

  const [room,       setRoom]       = useState<Room | null>(null)
  const [me,         setMe]         = useState<MyInfo | null>(null)
  const [allPlayers, setAllPlayers] = useState<Contestant[]>([])
  const [buzzed,     setBuzzed]     = useState(false)
  const [error,      setError]      = useState('')
  const subRef = useRef<any>(null)

  // Load contestant identity from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sow-contestant')
    if (!saved) { router.push(`/join?code=${code}`); return }
    const info = JSON.parse(saved) as MyInfo
    if (info.roomCode !== code) { router.push(`/join?code=${code}`); return }
    setMe(info)
  }, [code])

  // Load room + subscribe
  useEffect(() => {
    if (!code) return
    getRoom(code).then(r => {
      if (!r) { setError('Room not found'); return }
      setRoom(r)
    })
    subRef.current = subscribeToRoom(code, r => {
      setRoom(r)
      // Reset buzz state when a new question is pushed
      if (r.status === 'question') setBuzzed(false)
    })
    return () => subRef.current?.unsubscribe()
  }, [code])

  // Load scores
  useEffect(() => {
    if (!code) return
    getContestants(code).then(setAllPlayers)
  }, [room?.status])

  const handleBuzz = async () => {
    if (!room || !me || buzzed || room.status !== 'question') return
    if (room.buzzed_by) return // someone already buzzed
    setBuzzed(true)
    await updateRoom(code, { status: 'buzzed', buzzed_by: me.name })
  }

  if (error) return (
    <div className={styles.centered}>
      <div className={styles.errorCard}>
        <p className={styles.errorIcon}>😕</p>
        <p className={styles.errorText}>{error}</p>
        <button className="btn btn-ghost" onClick={() => router.push('/join')}>Back to Join</button>
      </div>
    </div>
  )

  if (!room || !me) return (
    <div className={styles.centered}>
      <div className={styles.loadingText}>Connecting…</div>
    </div>
  )

  if (room.status === 'ended') return (
    <div className={styles.centered}>
      <div className={styles.endCard}>
        <p className={styles.endIcon}>🏁</p>
        <h2 className={styles.endTitle}>Game Over!</h2>
        <div className={styles.finalScores}>
          {[...allPlayers].sort((a, b) => b.score - a.score).map((p, i) => (
            <div key={p.id} className={styles.finalRow} style={{ color: p.team_color }}>
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
              <span className={styles.finalName}>{p.name}</span>
              <span className={styles.finalScore}>{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const myScore = allPlayers.find(p => p.id === me.id)?.score ?? 0
  const isBuzzedByMe = room.buzzed_by === me.name
  const isBuzzedByOther = room.buzzed_by && room.buzzed_by !== me.name

  return (
    <div className={styles.playWrap}>
      {/* My identity + score */}
      <div className={styles.myBadge} style={{ borderColor: me.color }}>
        <span className={styles.myName}  style={{ color: me.color }}>{me.name}</span>
        <span className={styles.myScore} style={{ color: me.color }}>{myScore} pts</span>
      </div>

      {/* Status area */}
      <div className={styles.statusArea}>
        {room.status === 'waiting' && (
          <div className={styles.waitBox}>
            <div className={styles.waitIcon}>⏳</div>
            <p className={styles.waitText}>Waiting for host to start…</p>
            <p className={styles.roomCode}>Room: <strong>{code}</strong></p>
          </div>
        )}

        {(room.status === 'question' || room.status === 'buzzed') && room.current_q && (
          <div className={styles.questionBox}>
            <div className={styles.qCat}>
              {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
              &nbsp;{room.current_q.category}
            </div>
            {/* Only show question text after host reveals (status === 'revealed') */}
            <div className={styles.qHidden}>
              <span>🎯 Question received!</span>
              <p className={styles.qHiddenSub}>Listen carefully — buzz when you know the answer</p>
            </div>
          </div>
        )}

        {room.status === 'revealed' && room.current_q && (
          <div className={styles.revealedBox}>
            <div className={styles.qCat}>
              {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
              &nbsp;{room.current_q.category}
            </div>
            <p className={styles.qTextRevealed}>{room.current_q.question}</p>
          </div>
        )}
      </div>

      {/* Buzz button */}
      {(room.status === 'question' || room.status === 'buzzed') && (
        <div className={styles.buzzArea}>
          {isBuzzedByMe ? (
            <div className={styles.buzzedMe}>
              <div className={styles.buzzedIcon}>🔔</div>
              <p className={styles.buzzedText}>You buzzed first!</p>
              <p className={styles.buzzedSub}>Host is judging your answer…</p>
            </div>
          ) : isBuzzedByOther ? (
            <div className={styles.buzzedOther}>
              <p className={styles.buzzedOtherIcon}>⚡</p>
              <p className={styles.buzzedOtherText}>{room.buzzed_by} buzzed first</p>
            </div>
          ) : (
            <button
              className={styles.buzzBtn}
              style={{ '--bc': me.color } as React.CSSProperties}
              onClick={handleBuzz}
              disabled={buzzed}
            >
              <span className={styles.buzzBtnIcon}>🔔</span>
              <span className={styles.buzzBtnLabel}>BUZZ IN</span>
            </button>
          )}
        </div>
      )}

      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {[...allPlayers].sort((a, b) => b.score - a.score).map((p, i) => (
          <div key={p.id} className={`${styles.playerRow} ${p.id === me.id ? styles.isMe : ''}`}
            style={{ borderColor: p.team_color }}>
            <span className={styles.rank}>{i === 0 ? '👑' : i + 1}</span>
            <span className={styles.playerName} style={{ color: p.team_color }}>{p.name}</span>
            <span className={styles.playerScore} style={{ color: p.team_color }}>{p.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <PlayScreen />
    </Suspense>
  )
}
