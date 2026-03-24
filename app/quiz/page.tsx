'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/context/GameContext'
import ScoreBoard from '@/components/quiz/ScoreBoard'
import Round1Grid from '@/components/quiz/Round1Grid'
import Round2FastFingers from '@/components/quiz/Round2FastFingers'
import styles from './page.module.css'

export default function QuizPage() {
  const router = useRouter()
  const { game, setRound } = useGame()
  const [showEndScreen, setShowEndScreen] = useState(false)

  if (!game.started) {
    return (
      <div className={styles.notStarted}>
        <div className={styles.notStartedIcon}>🎯</div>
        <p className={styles.notStartedText}>No quiz in progress.</p>
        <button className="btn btn-primary" onClick={() => router.push('/setup')}>
          Go to Setup
        </button>
      </div>
    )
  }

  // Sort teams by score
  const sorted = [...(game.teams ?? [])].sort((a, b) => {
    const scoreA = typeof (a as any).score === 'number' ? (a as any).score : 0
    const scoreB = typeof (b as any).score === 'number' ? (b as any).score : 0
    return scoreB - scoreA
  })
  const date   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleCertificate = (team: typeof sorted[0], position: number) => {
    const posLabel = position === 1 ? '1st Place' : position === 2 ? '2nd Place' : position === 3 ? '3rd Place' : `${position}th Place`
    router.push(
      `/certificate?` +
      `winner=${encodeURIComponent(team.name)}&` +
      `score=${(team as any).score ?? 0}&` +
      `section=${encodeURIComponent(game.section ?? '')}&` +
      `category=Quiz Championship&` +
      `position=${encodeURIComponent(posLabel)}&` +
      `date=${encodeURIComponent(date)}`
    )
  }

  // ── END SCREEN ──
  if (showEndScreen) return (
    <div className={styles.endWrap}>
      <div className={styles.endCard}>
        <div className={styles.endConfetti}>🎉</div>
        <h1 className={styles.endTitle}>Quiz Complete!</h1>
        <p className={styles.endSub}>{game.section}</p>

        {/* Podium */}
        <div className={styles.podium}>
          {sorted.slice(0, 3).map((team, i) => (
            <div key={i} className={`${styles.podiumSlot} ${i === 0 ? styles.podiumFirst : ''}`}
              style={{ borderColor: team.color }}>
              <span className={styles.podiumMedal}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span className={styles.podiumName} style={{ color: team.color }}>{team.name}</span>
              <span className={styles.podiumScore} style={{ color: team.color }}>{(team as any).score ?? 0} pts</span>
            </div>
          ))}
        </div>

        {/* All teams with certificate buttons */}
        <div className={styles.allTeams}>
          <p className={styles.allTeamsTitle}>🏅 Download Certificates</p>
          {sorted.map((team, i) => (
            <div key={i} className={styles.teamCertRow} style={{ borderColor: team.color }}>
              <div className={styles.teamCertLeft}>
                <span className={styles.teamCertPos}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span className={styles.teamCertName} style={{ color: team.color }}>{team.name}</span>
                <span className={styles.teamCertScore} style={{ color: team.color }}>{(team as any).score ?? 0} pts</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCertificate(team, i + 1)}
                style={{ borderColor: team.color, color: team.color }}>
                🏅 Certificate
              </button>
            </div>
          ))}
        </div>

        <div className={styles.endBtns}>
          <button className="btn btn-primary" onClick={() => router.push('/leaderboard')}>
            📊 Leaderboard
          </button>
          <button className="btn btn-ghost" onClick={() => router.push('/setup')}>
            🔄 New Game
          </button>
        </div>
      </div>
    </div>
  )

  // ── ACTIVE QUIZ ──
  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.roundTitle}>
            {game.round === 'round1' ? 'Round 1 — Pick a Number' : 'Round 2 — Fastest Fingers'}
          </h1>
          <p className={styles.sectionLabel}>{game.section}</p>
        </div>

        <ScoreBoard />

        <div className={styles.actions}>
          <button className="btn btn-ghost btn-sm"
            onClick={() => setRound(game.round === 'round1' ? 'round2' : 'round1')}>
            Switch Round
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowEndScreen(true)}>
            🏁 End Quiz
          </button>
        </div>
      </div>

      {game.round === 'round1' ? <Round1Grid /> : <Round2FastFingers />}
    </div>
  )
}
