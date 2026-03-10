'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoom, getContestants, updateRoom, subscribeToRoom, subscribeToContestants, Room, Contestant } from '@/lib/rooms'
import { useSound } from '@/hooks/useSound'
import styles from './page.module.css'

interface ContestantInfo { id: string; name: string; color: string; roomCode: string }

function PlayContent() {
  const params   = useSearchParams()
  const router   = useRouter()
  const { play } = useSound()

  const code = (params.get('code') ?? '').toUpperCase()
  const [me,          setMe]          = useState<ContestantInfo | null>(null)
  const [room,        setRoom]        = useState<Room | null>(null)
  const [contestants, setContestants] = useState<Contestant[]>([])
  const [buzzed,      setBuzzed]      = useState(false)
  const [lockedOut,   setLockedOut]   = useState(false)
  const [timeLeft,    setTimeLeft]    = useState<number | null>(null)
  const [error,       setError]       = useState('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const subRef   = useRef<any>(null)
  const subCRef  = useRef<any>(null)

  // Load identity
  useEffect(() => {
    const raw = localStorage.getItem('sow-contestant')
    if (!raw) { router.push(`/join?code=${code}`); return }
    setMe(JSON.parse(raw))
  }, [])

  // Load room + subscribe
  useEffect(() => {
    if (!code) return
    getRoom(code).then(r => { if (!r) { setError('Room not found'); return }; setRoom(r) })
    getContestants(code).then(setContestants)
    subRef.current  = subscribeToRoom(code, r => {
      setRoom(r)
      if (r.status === 'question') { setBuzzed(false) }
    })
    subCRef.current = subscribeToContestants(code, c => setContestants(c))
    return () => { subRef.current?.unsubscribe(); subCRef.current?.unsubscribe() }
  }, [code])

  // Check lockout whenever contestants or room changes
  useEffect(() => {
    if (!me || !room?.current_q) { setLockedOut(false); return }
    const myRow = contestants.find(c => c.id === me.id)
    setLockedOut(myRow?.locked_q_id === room.current_q.id)
  }, [contestants, room?.current_q, me])

  // Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!room?.timer_started_at || room.status !== 'question') { setTimeLeft(null); return }
    const tick = () => {
      const elapsed = (Date.now() - new Date(room.timer_started_at!).getTime()) / 1000
      const left = Math.max(0, room.timer_seconds - elapsed)
      setTimeLeft(Math.ceil(left))
      if (left <= 0) clearInterval(timerRef.current!)
    }
    tick()
    timerRef.current = setInterval(tick, 250)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [room?.timer_started_at, room?.status])

  const handleBuzz = async () => {
    if (!room || !me || buzzed || lockedOut) return
    if (room.buzzed_by) return // someone already buzzed
    if (room.status !== 'question') return
    setBuzzed(true)
    play('buzz')
    await updateRoom(code, { status: 'buzzed', buzzed_by: me.name })
  }

  const myScore = contestants.find(c => c.id === me?.id)?.score ?? 0
  const sorted  = [...contestants].sort((a, b) => b.score - a.score)
  const timerPct = timeLeft !== null && room ? (timeLeft / room.timer_seconds) * 100 : 100
  const timerColor = !timeLeft ? '#555' : timerPct > 60 ? '#00e676' : timerPct > 28 ? '#FFD700' : '#ff1744'

  const canBuzz = room?.status === 'question' && !buzzed && !lockedOut && !room.buzzed_by

  if (error) return <div className={styles.errorWrap}><p className={styles.errorText}>{error}</p></div>
  if (!room || !me) return <div className={styles.loading}>Connecting…</div>

  return (
    <div className={styles.screen}>
      {/* My info */}
      <div className={styles.myBar} style={{ borderColor: me.color }}>
        <span className={styles.myName} style={{ color: me.color }}>{me.name}</span>
        <span className={styles.myScore} style={{ color: me.color }}>{myScore} pts</span>
      </div>

      {/* Game status */}
      <div className={styles.statusArea}>
        {room.status === 'waiting' && (
          <div className={styles.waitMsg}>
            <div className={styles.waitIcon}>⏳</div>
            <p>Waiting for host to start…</p>
          </div>
        )}

        {room.status === 'ended' && (
          <div className={styles.endMsg}>
            <div className={styles.endIcon}>🏁</div>
            <p className={styles.endText}>Game Over!</p>
            {sorted[0] && <p className={styles.winnerText} style={{ color: sorted[0].team_color }}>🥇 {sorted[0].name} wins!</p>}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => router.push('/')}>← Home</button>
          </div>
        )}

        {(room.status === 'question' || room.status === 'buzzed') && room.current_q && (
          <div className={styles.questionArea}>
            <div className={styles.qCat}>
              {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
              &nbsp;{room.current_q.category}
              {room.double_points && <span className={styles.doubleTag}>2✕</span>}
            </div>

            {timeLeft !== null && (
              <div className={styles.timerRow}>
                <div className={styles.timerBar} style={{ width: `${timerPct}%`, background: timerColor }} />
                <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
            )}

            <p className={styles.qText}>
              {room.current_q.category === 'Spelling Bee' ? 'Listen carefully and spell the word!' : room.current_q.question}
            </p>

            {room.status === 'buzzed' && (
              <div className={styles.buzzedInfo}>
                {room.buzzed_by === me.name
                  ? <span className={styles.youBuzzed}>🔔 You buzzed! Answer out loud.</span>
                  : <span className={styles.otherBuzzed}>🔔 {room.buzzed_by} buzzed first!</span>
                }
              </div>
            )}

            {lockedOut && (
              <div className={styles.lockedOut}>🔒 You're locked out for this question</div>
            )}
          </div>
        )}

        {room.status === 'revealed' && room.current_q && (
          <div className={styles.revealArea}>
            <p className={styles.revealLabel}>Answer:</p>
            <p className={styles.revealAnswer}>{room.current_q.answer}</p>
          </div>
        )}
      </div>

      {/* BUZZ button */}
      <div className={styles.buzzWrap}>
        <button
          className={`${styles.buzzBtn}
            ${canBuzz ? styles.buzzReady : ''}
            ${buzzed ? styles.buzzPressed : ''}
            ${lockedOut ? styles.buzzLocked : ''}
            ${room?.status === 'buzzed' && !buzzed ? styles.buzzMissed : ''}
          `}
          onClick={handleBuzz}
          disabled={!canBuzz}
        >
          {lockedOut ? '🔒 Locked Out' : buzzed ? '🔔 Buzzed!' : room?.status === 'buzzed' ? 'Too slow!' : room?.status === 'question' ? '🔔 BUZZ!' : '—'}
        </button>
      </div>

      {/* Live scoreboard */}
      <div className={styles.scoreList}>
        {sorted.map((c, i) => (
          <div key={c.id} className={`${styles.scoreRow} ${c.id === me.id ? styles.scoreRowMe : ''}`}
            style={{ borderColor: c.team_color }}>
            <span className={styles.scoreRank}>{i === 0 ? '👑' : i + 1}</span>
            <span className={styles.scoreName} style={{ color: c.team_color }}>{c.name}</span>
            <span className={styles.scoreVal}  style={{ color: c.team_color }}>{c.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>Connecting…</div>}>
      <PlayContent />
    </Suspense>
  )
}
