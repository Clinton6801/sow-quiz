'use client'

/**
 * /spelling/end — End screen.
 * Shows final score, streak, accuracy.
 * Saves score to spelling_scores table.
 * Options: download certificate, view leaderboard, play again.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function SpellingEndPage() {
  const router = useRouter()

  const [playerName, setPlayerName] = useState('')
  const [section,    setSection]    = useState('')
  const [score,      setScore]      = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [accuracy,   setAccuracy]   = useState(0)
  const [correct,    setCorrect]    = useState(0)
  const [saved,      setSaved]      = useState(false)

  useEffect(() => {
    const name = sessionStorage.getItem('spelling_player') ?? ''
    const sec  = sessionStorage.getItem('spelling_section') ?? ''
    const sc   = parseInt(sessionStorage.getItem('spelling_score')    ?? '0')
    const st   = parseInt(sessionStorage.getItem('spelling_streak')   ?? '0')
    const ac   = parseInt(sessionStorage.getItem('spelling_accuracy') ?? '0')
    const co   = parseInt(sessionStorage.getItem('spelling_correct')  ?? '0')

    if (!name) { router.replace('/spelling'); return }

    setPlayerName(name)
    setSection(sec)
    setScore(sc)
    setStreak(st)
    setAccuracy(ac)
    setCorrect(co)

    saveScore(name, sec, sc, st, ac)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveScore(name: string, sec: string, sc: number, st: number, ac: number) {
    await supabase.from('spelling_scores').insert({
      player_name: name,
      section: sec,
      score: sc,
      streak: st,
      accuracy: ac,
    })
    setSaved(true)
  }

  function handlePlayAgain() {
    sessionStorage.removeItem('spelling_score')
    sessionStorage.removeItem('spelling_streak')
    sessionStorage.removeItem('spelling_accuracy')
    sessionStorage.removeItem('spelling_correct')
    router.push('/spelling/play')
  }

  function handleCertificate() {
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const params = new URLSearchParams({
      winner:   playerName,
      score:    String(score),
      section:  section,
      category: 'Spelling Bee',
      date,
    })
    router.push(`/certificate?${params.toString()}`)
  }

  const grade      = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : accuracy >= 30 ? 'C' : 'D'
  const gradeColor = accuracy >= 90 ? 'var(--gold)' : accuracy >= 70 ? 'var(--green)' : accuracy >= 50 ? 'var(--cyan)' : accuracy >= 30 ? '#FFA500' : 'var(--red)'
  const emoji      = accuracy >= 70 ? '🏆' : accuracy >= 40 ? '🎯' : '💪'

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerEmoji}>{emoji}</div>
        <h1 className={styles.title}>GAME OVER</h1>
        <p className={styles.subtitle}>
          Well done, <span style={{ color: 'var(--cyan)', fontWeight: 900 }}>{playerName}</span>!
        </p>
      </div>

      {/* Score card */}
      <div className={styles.card}>

        {/* Grade circle */}
        <div className={styles.gradeWrap}>
          <div className={styles.gradeCircle} style={{ borderColor: gradeColor, color: gradeColor, background: `${gradeColor}18` }}>
            {grade}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem} style={{ '--accent': 'var(--gold)' } as React.CSSProperties}>
            <span className={styles.statNum} style={{ color: 'var(--gold)' }}>{score}</span>
            <span className={styles.statLbl}>Score</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum} style={{ color: 'var(--green)' }}>{streak > 0 ? `${streak}🔥` : '0'}</span>
            <span className={styles.statLbl}>Best Streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum} style={{ color: 'var(--cyan)' }}>{accuracy}%</span>
            <span className={styles.statLbl}>Accuracy</span>
          </div>
        </div>

        <p className={styles.summary}>{correct} / 10 words correct · {section}</p>

        {saved && (
          <p className={styles.savedNote}>✓ Score saved to leaderboard</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={handlePlayAgain} className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          🔄 PLAY AGAIN
        </button>

        <button onClick={handleCertificate} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          🏅 Download Certificate
        </button>

        <Link href="/spelling/leaderboard" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          🏆 View Leaderboard
        </Link>

        <Link href="/spelling" className={styles.backLink}>
          ← Back to Lobby
        </Link>
      </div>
    </div>
  )
}
