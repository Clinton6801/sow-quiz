'use client'
import { useState, useEffect, useRef } from 'react'
import { Question, CATEGORY_ICONS } from '../../lib/questions'
import { useGame } from '../../context/GameContext'
import { useToast } from '../../context/ToastContext'
import { upsertScore } from '../../lib/scores'
import { speakWord } from '../../lib/speech'
import styles from './QuestionModal.module.css'

interface Props {
  question: Question
  onClose: () => void
  onAwarded?: () => void
  timerSeconds?: number   // optional countdown — passed from quiz page
}

export default function QuestionModal({ question, onClose, onAwarded, timerSeconds }: Props) {
  const { game, awardPoints, markAnswered } = useGame()
  const { showToast } = useToast()
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmNoAnswer, setConfirmNoAnswer] = useState(false)

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds ?? null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isSpelling = question.category === 'Spelling Bee'

  // Start countdown if timerSeconds provided
  useEffect(() => {
    if (!timerSeconds) return
    setTimeLeft(timerSeconds)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          showToast("⏰ Time's up!", 'info')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerSeconds])

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const speak = () => {
    // Use speakWord from lib/speech for proper pronunciation (fixes short words)
    speakWord(question.question)
  }

  const award = async (teamName: string) => {
    stopTimer()
    setLoading(teamName)
    try {
      awardPoints(teamName, game.pointsPerQ, question.id)
      markAnswered(question.id)
      await upsertScore({ teamName, section: game.section, addScore: game.pointsPerQ, addWin: false })
      showToast(`+${game.pointsPerQ} pts → ${teamName}!`, 'success')
      onAwarded?.()
      onClose()
    } catch {
      showToast('Error saving score', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleNoAnswer = () => {
    if (!confirmNoAnswer) {
      setConfirmNoAnswer(true)
      return
    }
    stopTimer()
    markAnswered(question.id)
    showToast('No answer — question skipped', 'info')
    onAwarded?.()
    onClose()
  }

  const timerPct = timeLeft !== null && timerSeconds ? (timeLeft / timerSeconds) * 100 : 100
  const timerColor = !timeLeft ? '#555'
    : timerPct > 60 ? 'var(--green)'
    : timerPct > 28 ? 'var(--gold)'
    : 'var(--danger)'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className={styles.cat}>
          {CATEGORY_ICONS[question.category]} {question.category} · {game.section}
        </div>

        <h2 className={styles.heading}>Question</h2>

        {/* Optional countdown timer */}
        {timeLeft !== null && (
          <div className={styles.timerWrap}>
            <div className={styles.timerBar} style={{ width: `${timerPct}%`, background: timerColor }} />
            <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
        )}

        {/* For Spelling Bee: show blurred word + audio only. For others: show question normally */}
        {isSpelling ? (
          <div className={styles.spellingWrap}>
            <p className={styles.spellingLabel}>Spell the word:</p>
            <div className={`${styles.spellingWord} ${revealed ? styles.unblurred : ''}`}>
              {question.question}
            </div>
            {!revealed && (
              <p className={styles.blurHint}>👆 Word is hidden — use audio for contestants</p>
            )}
          </div>
        ) : (
          <p className={styles.qText}>{question.question}</p>
        )}

        {isSpelling && (
          <button className={styles.audioBtn} onClick={speak}>
            🔊 Hear the Word
          </button>
        )}

        {revealed ? (
          <div className={styles.answerBox}>
            <span className={styles.answerLabel}>Answer: </span>
            <span className={styles.answerVal}>{question.answer}</span>
          </div>
        ) : (
          <button className={`btn btn-ghost btn-sm ${styles.revealBtn}`} onClick={() => setRevealed(true)}>
            👁 Reveal Word &amp; Answer
          </button>
        )}

        <p className={styles.awardLabel}>Award points to:</p>
        <div className={styles.awardRow}>
          {game.teams.map(t => (
            <button
              key={t.name}
              className={styles.awardBtn}
              style={{ '--tc': t.color } as React.CSSProperties}
              onClick={() => award(t.name)}
              disabled={!!loading}
            >
              {loading === t.name ? '...' : `+${game.pointsPerQ} → ${t.name}`}
            </button>
          ))}
        </div>

        <div className={styles.bottomRow}>
          {confirmNoAnswer ? (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>No points awarded. Sure?</span>
              <button className={styles.confirmYes} onClick={handleNoAnswer} disabled={!!loading}>
                ✓ Yes, Skip
              </button>
              <button className={styles.confirmNo} onClick={() => setConfirmNoAnswer(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className={styles.noAnswerBtn}
              onClick={handleNoAnswer}
              disabled={!!loading}
            >
              ✗ No Answer
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
