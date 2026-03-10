'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoom, getContestants, updateRoom, subscribeToRoom, subscribeToContestants, Room, Contestant } from '../../lib/rooms'
import { useSound } from '../../hooks/useSound'
import styles from './page.module.css'

interface ContestantInfo { id: string; name: string; color: string; roomCode: string }

function PlayContent() {
  const params   = useSearchParams()
  const router   = useRouter()
  const { play } = useSound()
  const code     = (params.get('code') ?? '').toUpperCase()

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

  useEffect(() => {
    const raw = localStorage.getItem('sow-contestant')
    if (!raw) { router.push(`/join?code=${code}`); return }
    setMe(JSON.parse(raw))
  }, [])

  useEffect(() => {
    if (!code) return
    getRoom(code).then(r => { if (!r) { setError('Room not found'); return }; setRoom(r) })
    getContestants(code).then(setContestants)
    subRef.current  = subscribeToRoom(code, r => {
      setRoom(r)
      if (r.status === 'question') setBuzzed(false)
    })
    subCRef.current = subscribeToContestants(code, setContestants)
    return () => { subRef.current?.unsubscribe(); subCRef.current?.unsubscribe() }
  }, [code])

  useEffect(() => {
    if (!me || !room?.current_q) { setLockedOut(false); return }
    const myRow = contestants.find(c => c.id === me.id)
    setLockedOut(myRow?.locked_q_id === room.current_q!.id)
  }, [contestants, room?.current_q, me])

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
    if (!room || !me || buzzed || lockedOut || room.buzzed_by || room.status !== 'question') return
    setBuzzed(true)
    play('buzz')
    await updateRoom(code, { status: 'buzzed', buzzed_by: me.name })
  }

  const myScore  = contestants.find(c => c.id === me?.id)?.score ?? 0
  const sorted   = [...contestants].sort((a, b) => b.score - a.score)
  const timerPct = timeLeft !== null && room ? (timeLeft / room.timer_seconds) * 100 : 100
  const timerColor = !timeLeft ? '#555' : timerPct > 60 ? '#00e676' : timerPct > 28 ? '#FFD700' : '#ff1744'
  const canBuzz  = room?.status === 'question' && !buzzed && !lockedOut && !room.buzzed_by

  if (error) return (
    <div className={styles.centered}>
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>😕</div>
        <p className={styles.errorText}>{error}</p>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/join')}>← Try Again</button>
      </div>
    </div>
  )
  if (!room || !me) return (
    <div className={styles.centered}>
      <div className={styles.loadingText}>Connecting…</div>
    </div>
  )

  return (
    <div className={styles.playWrap}>

      {/* My identity bar */}
      <div className={styles.myBadge} style={{ borderColor: me.color }}>
        <span className={styles.myName} style={{ color: me.color }}>{me.name}</span>
        <span className={styles.myScore} style={{ color: me.color }}>{myScore} <small>pts</small></span>
      </div>

      {/* Status area */}
      <div className={styles.statusArea}>

        {/* WAITING */}
        {room.status === 'waiting' && (
          <div className={styles.waitBox}>
            <div className={styles.waitIcon}>⏳</div>
            <p className={styles.waitText}>Waiting for host to start…</p>
            <p className={styles.roomCode}>Room: <strong>{code}</strong></p>
          </div>
        )}

        {/* QUESTION ACTIVE */}
        {(room.status === 'question' || room.status === 'buzzed') && room.current_q && (
          <div className={styles.questionBox}>
            <div className={styles.qCat}>
              {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
              &nbsp;{room.current_q.category}
              {room.double_points && <span className={styles.doubleTag}>2✕</span>}
            </div>

            {timeLeft !== null && (
              <div className={styles.timerRow}>
                <div className={styles.timerTrack}>
                  <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
                </div>
                <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
              </div>
            )}

            <div className={styles.qHidden}>
              <span>❓ Question received!</span>
              <p className={styles.qHiddenSub}>
                {room.current_q.category === 'Spelling Bee'
                  ? 'Listen and spell the word — buzz when ready!'
                  : 'Read the question on the main screen — buzz when you know!'}
              </p>
            </div>

            {room.status === 'buzzed' && (
              <div className={styles.buzzedInfo}>
                {room.buzzed_by === me.name
                  ? <p className={styles.youBuzzed}>🔔 You buzzed! Answer out loud.</p>
                  : <p className={styles.otherBuzzed}>🔔 {room.buzzed_by} buzzed first!</p>
                }
              </div>
            )}

            {lockedOut && (
              <div className={styles.lockedOutMsg}>🔒 You're locked out for this question</div>
            )}
          </div>
        )}

        {/* ANSWER REVEALED */}
        {room.status === 'revealed' && room.current_q && (
          <div className={styles.revealedBox}>
            <p className={styles.revealLabel}>Answer:</p>
            <p className={styles.revealAnswer}>{room.current_q.answer}</p>
          </div>
        )}

        {/* GAME ENDED */}
        {room.status === 'ended' && (
          <div className={styles.endCard}>
            <div className={styles.endIcon}>🏁</div>
            <p className={styles.endTitle}>Game Over!</p>
            {sorted[0] && (
              <p className={styles.winnerText} style={{ color: sorted[0].team_color }}>
                🥇 {sorted[0].name} wins with {sorted[0].score} pts!
              </p>
            )}
            <div className={styles.finalScores}>
              {sorted.map((c, i) => (
                <div key={c.id} className={styles.finalRow}>
                  <span>{['🥇','🥈','🥉'][i] ?? `${i+1}`}</span>
                  <span className={styles.finalName} style={{ color: c.team_color }}>{c.name}</span>
                  <span className={styles.finalScore} style={{ color: c.team_color }}>{c.score}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 20 }} onClick={() => router.push('/')}>← Home</button>
          </div>
        )}
      </div>

      {/* BUZZ BUTTON */}
      {room.status !== 'ended' && (
        <div className={styles.buzzArea}>
          <button
            className={`${styles.buzzBtn}
              ${canBuzz ? styles.buzzReady : ''}
              ${buzzed ? styles.buzzPressed : ''}
              ${lockedOut ? styles.buzzLocked : ''}
              ${room.status === 'buzzed' && !buzzed && !lockedOut ? styles.buzzMissed : ''}
            `}
            style={canBuzz ? { '--bc': me.color } as any : {}}
            onClick={handleBuzz}
            disabled={!canBuzz}
          >
            <span className={styles.buzzBtnIcon}>
              {lockedOut ? '🔒' : buzzed ? '🔔' : room.status === 'question' ? '🔔' : '—'}
            </span>
            <span className={styles.buzzBtnLabel}>
              {lockedOut ? 'Locked Out'
                : buzzed ? 'Buzzed!'
                : room.status === 'buzzed' ? 'Too Slow!'
                : room.status === 'question' ? 'BUZZ!'
                : room.status === 'revealed' ? 'Revealed'
                : 'Wait…'}
            </span>
          </button>
        </div>
      )}

      {/* SCOREBOARD */}
      <div className={styles.scoreboard}>
        {sorted.map((c, i) => (
          <div key={c.id}
            className={`${styles.playerRow} ${c.id === me.id ? styles.isMe : ''}`}
            style={{ borderColor: c.team_color }}>
            <span className={styles.rank}>{i === 0 && sorted.length > 1 ? '👑' : i + 1}</span>
            <span className={styles.playerName} style={{ color: c.team_color }}>{c.name}</span>
            <span className={styles.playerScore} style={{ color: c.team_color }}>{c.score}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text2)', padding: 40, textAlign: 'center' }}>Connecting…</div>}>
      <PlayContent />
    </Suspense>
  )
}