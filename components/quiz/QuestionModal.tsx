'use client'
import { useState } from 'react'
import { Question, CATEGORY_ICONS } from '../../lib/questions'
import { useGame } from '../../context/GameContext'
import { useToast } from '../../context/ToastContext'
import { upsertScore } from '../../lib/scores'
import styles from './QuestionModal.module.css'

interface Props {
  question: Question
  onClose: () => void
  onAwarded?: () => void
}

export default function QuestionModal({ question, onClose, onAwarded }: Props) {
  const { game, awardPoints, markAnswered } = useGame()
  const { showToast } = useToast()
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const isSpelling = question.category === 'Spelling Bee'

  const speak = () => {
    if (!window.speechSynthesis) { showToast('Speech not supported', 'error'); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(question.question)
    u.rate = 0.75
    window.speechSynthesis.speak(u)
  }

  const award = async (teamName: string) => {
    setLoading(teamName)
    try {
      awardPoints(teamName, game.pointsPerQ)
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

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className={styles.cat}>
          {CATEGORY_ICONS[question.category]} {question.category} · {game.section}
        </div>

        <h2 className={styles.heading}>Question</h2>

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

        <button className="btn btn-danger btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}