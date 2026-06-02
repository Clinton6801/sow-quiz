'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '../../context/GameContext'
import ScoreBoard from '../../components/quiz/ScoreBoard'
import Round1Grid from '../../components/quiz/Round1Grid'
import Round2FastFingers from '../../components/quiz/Round2FastFingers'
import Round3Gauntlet from '../../components/quiz/Round3Gauntlet'
import styles from './page.module.css'

export default function QuizPage() {
  const router = useRouter()
  const { game, setRound, lastAward, undoLastAward, adjustPoints } = useGame()
  const [showEndScreen, setShowEndScreen] = useState(false)
  const [showTimerConfig, setShowTimerConfig] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number | undefined>(undefined)
  const [timerInput, setTimerInput] = useState(30)

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

  const sorted = [...(game.teams ?? [])].map(team => ({
    ...team,
    score: game.scores?.[team.name] ?? 0,
  })).sort((a, b) => b.score - a.score)

  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleCertificate = (team: typeof sorted[0], position: number) => {
    const posLabel = position === 1 ? '1st Place' : position === 2 ? '2nd Place' : position === 3 ? '3rd Place' : `${position}th Place`
    const photoParam = team.photo ? `&photo=${encodeURIComponent(team.photo)}` : ''
    router.push(
      `/certificate?` +
      `winner=${encodeURIComponent(team.name)}&` +
      `score=${team.score}&` +
      `section=${encodeURIComponent(game.section ?? '')}&` +
      `category=Quiz Championship&` +
      `position=${encodeURIComponent(posLabel)}&` +
      `date=${encodeURIComponent(date)}` +
      photoParam
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
              {team.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={team.photo} alt={team.name} className={styles.podiumPhoto} />
                : <span className={styles.podiumMedal}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
              }
              <span className={styles.podiumName} style={{ color: team.color }}>{team.name}</span>
              <span className={styles.podiumScore} style={{ color: team.color }}>{(
                team as any).score ?? 0} pts</span>
            </div>
          ))}
        </div>

        {/* All teams with certificate buttons */}
        <div className={styles.allTeams}>
          <p className={styles.allTeamsTitle}>🏅 Download Certificates</p>
          {sorted.map((team, i) => (
            <div key={i} className={styles.teamCertRow} style={{ borderColor: team.color }}>
              <div className={styles.teamCertLeft}>
                {team.photo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={team.photo} alt={team.name} className={styles.teamCertPhoto} />
                  : <span className={styles.teamCertPos}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                }
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
            {game.round === 'round1' ? 'Round 1 — Pick a Number' : game.round === 'round2' ? 'Round 2 — Fastest Fingers' : 'Round 3 — Gauntlet'}
          </h1>
          <p className={styles.sectionLabel}>{game.section}</p>
        </div>

        <ScoreBoard />

        <div className={styles.actions}>
          {/* Undo last award */}
          {lastAward && (
            <button className={`btn btn-ghost btn-sm ${styles.undoBtn}`} onClick={undoLastAward}
              title={`Undo +${lastAward.pts} → ${lastAward.teamName}`}>
              ↩ Undo ({lastAward.teamName})
            </button>
          )}

          {/* Timer toggle for Round 1 */}
          {game.round === 'round1' && (
            <div className={styles.timerConfig}>
              <button
                className={`btn btn-ghost btn-sm ${timerSeconds ? styles.timerActive : ''}`}
                onClick={() => setShowTimerConfig(v => !v)}
                title="Configure question timer"
              >
                ⏱ {timerSeconds ? `${timerSeconds}s` : 'Timer'}
              </button>
              {showTimerConfig && (
                <div className={styles.timerDropdown}>
                  <p className={styles.timerDropLabel}>Question timer</p>
                  <div className={styles.timerRow}>
                    <input
                      type="number" min={5} max={120} value={timerInput}
                      onChange={e => setTimerInput(Number(e.target.value))}
                      className={styles.timerInput}
                    />
                    <span className={styles.timerSec}>sec</span>
                  </div>
                  <div className={styles.timerBtns}>
                    <button className="btn btn-green btn-sm" onClick={() => {
                      setTimerSeconds(timerInput)
                      setShowTimerConfig(false)
                    }}>Enable</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      setTimerSeconds(undefined)
                      setShowTimerConfig(false)
                    }}>Off</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual score adjust */}
          <div className={styles.scoreAdjust}>
            {game.teams.map(t => (
              <div key={t.name} className={styles.adjustRow}>
                <span className={styles.adjustName} style={{ color: t.color }}>{t.name}</span>
                <button className={styles.adjustBtn} onClick={() => adjustPoints(t.name, game.pointsPerQ)}
                  title={`+${game.pointsPerQ} pts`}>+</button>
                <button className={styles.adjustBtn} onClick={() => adjustPoints(t.name, -game.pointsPerQ)}
                  title={`-${game.pointsPerQ} pts`}>−</button>
              </div>
            ))}
          </div>

          <div className={styles.roundSwitcher}>
            <button className={`btn btn-ghost btn-sm ${game.round === 'round1' ? styles.roundActive : ''}`}
              onClick={() => setRound('round1')}>
              Round 1
            </button>
            <button className={`btn btn-ghost btn-sm ${game.round === 'round2' ? styles.roundActive : ''}`}
              onClick={() => setRound('round2')}>
              Round 2
            </button>
            <button className={`btn btn-ghost btn-sm ${game.round === 'round3' ? styles.roundActive : ''}`}
              onClick={() => setRound('round3')}>
              Round 3
            </button>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowEndScreen(true)}>
            🏁 End Quiz
          </button>
        </div>
      </div>

      {game.round === 'round1'
        ? <Round1Grid timerSeconds={timerSeconds} />
        : game.round === 'round2'
        ? <Round2FastFingers />
        : <Round3Gauntlet />
      }
    </div>
  )
}
