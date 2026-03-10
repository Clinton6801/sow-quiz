'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { getRoom, getContestants, subscribeToRoom, subscribeToContestants, Room, Contestant } from '../../lib/rooms'
import styles from './page.module.css'

function AudienceView() {
  const params = useSearchParams()
  const code   = (params.get('code') ?? '').toUpperCase()

  const [room,        setRoom]        = useState<Room | null>(null)
  const [contestants, setContestants] = useState<Contestant[]>([])
  const [timeLeft,    setTimeLeft]    = useState<number | null>(null)
  const [error,       setError]       = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const subRef   = useRef<any>(null)
  const subCRef  = useRef<any>(null)

  useEffect(() => {
    if (!code) { setError('No room code provided. Add ?code=SOW-XXX to the URL.'); return }
    getRoom(code).then(r => {
      if (!r) { setError(`Room "${code}" not found.`); return }
      setRoom(r)
    })
    getContestants(code).then(setContestants)
    subRef.current  = subscribeToRoom(code, r => { setRoom(r) })
    subCRef.current = subscribeToContestants(code, setContestants)
    return () => { subRef.current?.unsubscribe(); subCRef.current?.unsubscribe() }
  }, [code])

  // Sync countdown timer from room
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!room?.timer_started_at || room.status !== 'question') {
      setTimeLeft(null); return
    }
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

  const sorted = [...contestants].sort((a, b) => b.score - a.score)
  const timerPct = timeLeft !== null && room ? (timeLeft / room.timer_seconds) * 100 : 100
  const timerColor = !timeLeft ? '#555' : timerPct > 60 ? '#00e676' : timerPct > 28 ? '#FFD700' : '#ff1744'

  if (error) return (
    <div className={styles.errorWrap}>
      <p className={styles.errorText}>{error}</p>
    </div>
  )
  if (!room) return <div className={styles.loading}>Connecting to room…</div>

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoWrap}>
          <Image src="/logo.jpeg" alt="SOW" width={56} height={56} className={styles.logo} />
        </div>
        <div className={styles.headerText}>
          <span className={styles.schoolName}>Seat of Wisdom Group of Schools</span>
          <span className={styles.quizTitle}>Quiz Championship</span>
        </div>
        <div className={styles.roomCode}>Room: <strong>{code}</strong></div>
      </div>

      {/* Main content */}
      <div className={styles.main}>
        {/* LEFT: Question area */}
        <div className={styles.questionSide}>
          {room.status === 'waiting' && (
            <div className={styles.waitState}>
              <div className={styles.waitIcon}>⏳</div>
              <p className={styles.waitText}>Game starting soon…</p>
              <p className={styles.waitSub}>{room.section}</p>
            </div>
          )}

          {room.status === 'ended' && (
            <div className={styles.endState}>
              <div className={styles.endIcon}>🏆</div>
              <p className={styles.endText}>Game Over!</p>
              {sorted[0] && (
                <p className={styles.winnerText} style={{ color: sorted[0].team_color }}>
                  🥇 {sorted[0].name} wins with {sorted[0].score} pts!
                </p>
              )}
            </div>
          )}

          {(room.status === 'question' || room.status === 'buzzed') && room.current_q && (
            <div className={styles.questionState}>
              <div className={styles.qMeta}>
                <span className={styles.qCat}>
                  {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
                  &nbsp;{room.current_q.category}
                </span>
                {room.double_points && <span className={styles.doubleTag}>2✕ DOUBLE POINTS</span>}
              </div>

              {/* Timer bar */}
              {timeLeft !== null && (
                <div className={styles.timerWrap}>
                  <div className={styles.timerBar} style={{ width: `${timerPct}%`, background: timerColor }} />
                  <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
                </div>
              )}

              <p className={styles.questionText}>
                {room.current_q.category === 'Spelling Bee'
                  ? `Spell the word: ?` // Hidden on audience screen until revealed
                  : room.current_q.question
                }
              </p>

              {room.status === 'buzzed' && room.buzzed_by && (
                <div className={styles.buzzBanner}>
                  🔔 <strong>{room.buzzed_by}</strong> buzzed in!
                </div>
              )}
            </div>
          )}

          {room.status === 'revealed' && room.current_q && (
            <div className={styles.revealedState}>
              <div className={styles.qMeta}>
                <span className={styles.qCat}>
                  {room.current_q.category === 'Maths' ? '📐' : room.current_q.category === 'Spelling Bee' ? '🐝' : '🌍'}
                  &nbsp;{room.current_q.category}
                </span>
              </div>
              <p className={styles.questionText}>{room.current_q.question}</p>
              <div className={styles.answerReveal}>
                <span className={styles.answerLabel}>Answer:</span>
                <span className={styles.answerVal}>{room.current_q.answer}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Scoreboard */}
        <div className={styles.scoreSide}>
          <h2 className={styles.scoreTitle}>🏆 Scoreboard</h2>
          <div className={styles.scoreList}>
            {sorted.length === 0
              ? <p className={styles.noPlayers}>Waiting for players…</p>
              : sorted.map((c, i) => (
                <div key={c.id} className={`${styles.scoreRow} ${i === 0 ? styles.first : ''}`}
                  style={{ borderColor: c.team_color }}>
                  <span className={styles.rank}>
                    {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <span className={styles.playerName} style={{ color: c.team_color }}>{c.name}</span>
                  <span className={styles.playerScore} style={{ color: c.team_color }}>{c.score}</span>
                </div>
              ))
            }
          </div>
          <div className={styles.sectionTag}>{room.section}</div>
        </div>
      </div>
    </div>
  )
}

export default function AudiencePage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: 40 }}>Loading…</div>}>
      <AudienceView />
    </Suspense>
  )
}
