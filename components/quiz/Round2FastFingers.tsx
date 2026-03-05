'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useGame } from '@/context/GameContext'
import { useToast } from '@/context/ToastContext'
import { getAllForSection, Question } from '@/lib/questions'
import { upsertScore } from '@/lib/scores'
import { Team } from '@/lib/types'
import styles from './Round2FastFingers.module.css'

export default function Round2FastFingers() {
  const { game, awardPoints } = useGame()
  const { showToast } = useToast()

  const [allQs, setAllQs]     = useState<Question[]>([])
  const [idx, setIdx]         = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const [buzzed, setBuzzed]   = useState<Team | null>(null)
  const [locked, setLocked]   = useState(false)
  const [pct, setPct]         = useState(100)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const grouped = await getAllForSection(game.section as any)
    const flat = Object.values(grouped).flat().sort(() => Math.random() - 0.5)
    setAllQs(flat)
    setIdx(-1); setBuzzed(null); setLocked(false); setRevealed(false)
  }, [game.section])

  useEffect(() => { load() }, [load])
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const current = idx >= 0 ? allQs[idx] : null

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    let v = 100
    setPct(100)
    timerRef.current = setInterval(() => {
      v -= 0.5
      setPct(Math.max(0, v))
      if (v <= 0) {
        clearInterval(timerRef.current!)
        setRevealed(true)
        showToast("⏰ Time's up!", 'info')
      }
    }, 50)
  }

  const next = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    const n = idx + 1
    if (n >= allQs.length) { showToast('All questions done!', 'info'); return }
    setIdx(n); setBuzzed(null); setLocked(false); setRevealed(false)
    startTimer()
  }

  const handleBuzz = (team: Team) => {
    if (locked || idx < 0) return
    if (timerRef.current) clearInterval(timerRef.current)
    setLocked(true)
    setBuzzed(team)
  }

  const judge = async (team: Team, correct: boolean) => {
    if (correct) {
      awardPoints(team.name, game.pointsPerQ)
      await upsertScore({ teamName: team.name, section: game.section, addScore: game.pointsPerQ, addWin: true }).catch(console.error)
      showToast(`✅ +${game.pointsPerQ} → ${team.name}!`, 'success')
    } else {
      showToast(`❌ Wrong — no points for ${team.name}`, 'error')
    }
    setBuzzed(null)
  }

  const timerColor = pct > 60 ? 'var(--green)' : pct > 28 ? 'var(--gold)' : 'var(--danger)'

  return (
    <div className={styles.wrap}>
      {/* Question */}
      <div className={styles.qBox}>
        {!current
          ? <p className={styles.placeholder}>Press <strong>Next Question</strong> to begin!</p>
          : <>
              <div className={styles.qCat}>
                {current.category === 'Maths' ? '📐' : current.category === 'Spelling Bee' ? '🐝' : '🌍'}
                &nbsp;{current.category}
              </div>
              <p className={styles.qText}>
                {current.category === 'Spelling Bee'
                  ? `Spell the word: "${current.question}"`
                  : current.question}
              </p>
              {current.category === 'Spelling Bee' && (
                <button className={styles.audioBtn} onClick={() => {
                  if (!window.speechSynthesis) return
                  window.speechSynthesis.cancel()
                  const u = new SpeechSynthesisUtterance(current.question)
                  u.rate = 0.75
                  window.speechSynthesis.speak(u)
                }}>🔊 Hear the Word</button>
              )}
            </>
        }
      </div>

      {/* Timer */}
      <div className={styles.timerWrap}>
        <div className={styles.timerBar} style={{ width: `${pct}%`, background: timerColor }} />
      </div>

      {/* Buzz buttons */}
      <div className={styles.buzzRow}>
        {game.teams.map(t => (
          <button
            key={t.name}
            className={`${styles.buzzBtn} ${buzzed?.name === t.name ? styles.buzzed : ''}`}
            style={{ '--tc': t.color } as React.CSSProperties}
            onClick={() => handleBuzz(t)}
            disabled={locked || idx < 0}
          >
            <span className={styles.buzzIcon}>🔔</span>
            <span className={styles.buzzLabel}>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Judge panel */}
      {buzzed && (
        <div className={styles.judgeBox} style={{ borderColor: buzzed.color }}>
          <p style={{ color: buzzed.color, fontWeight: 800, marginBottom: 12 }}>
            🔔 {buzzed.name} buzzed first!
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green btn-sm" onClick={() => judge(buzzed, true)}>✓ Correct</button>
            <button className="btn btn-danger btn-sm" onClick={() => judge(buzzed, false)}>✗ Wrong</button>
          </div>
        </div>
      )}

      {/* Answer reveal */}
      {revealed && current && (
        <div className={styles.answerReveal}>
          Answer: <strong>{current.answer}</strong>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <button className="btn btn-gold" onClick={next}>▶ Next Question</button>
        {current && !revealed && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            setRevealed(true)
          }}>
            👁 Reveal Answer
          </button>
        )}
        <span className={styles.prog}>{Math.max(0, idx + 1)} / {allQs.length}</span>
      </div>
    </div>
  )
}
