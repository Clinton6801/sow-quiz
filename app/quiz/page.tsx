'use client'
import { useRouter } from 'next/navigation'
import { useGame } from '../../context/GameContext'
import ScoreBoard from '../../components/quiz/ScoreBoard'
import Round1Grid from '../../components/quiz/Round1Grid'
import Round2FastFingers from '../../components/quiz/Round2FastFingers'
import styles from './page.module.css'

export default function QuizPage() {
  const router = useRouter()
  const { game, setRound } = useGame()

  if (!game.started) {
    return (
      <div className={styles.notStarted}>
        <p>No quiz in progress.</p>
        <button className="btn btn-primary" onClick={() => router.push('/setup')}>
          Go to Setup
        </button>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.roundTitle}>
            {game.round === 'round1' ? 'Round 1 — Pick a Number' : 'Round 2 — Fastest Fingers'}
          </h1>
          <p className={styles.sectionLabel}>{game.section}</p>
        </div>

        <ScoreBoard />

        <div className={styles.actions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setRound(game.round === 'round1' ? 'round2' : 'round1')}
          >
            Switch Round
          </button>
          <button className="btn btn-navy btn-sm" onClick={() => router.push('/leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>
      </div>

      {/* Content */}
      {game.round === 'round1' ? <Round1Grid /> : <Round2FastFingers />}
    </div>
  )
}
