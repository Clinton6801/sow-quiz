'use client'
import { useGame } from '../../context/GameContext'
import styles from './ScoreBoard.module.css'

export default function ScoreBoard() {
  const { game } = useGame()
  const max = Math.max(...game.teams.map(t => game.scores[t.name] || 0), 0)

  return (
    <div className={styles.wrap}>
      {game.teams.map(t => {
        const score = game.scores[t.name] || 0
        const leading = score === max && score > 0
        return (
          <div key={t.name} className={`${styles.badge} ${leading ? styles.leading : ''}`}
            style={{ '--tc': t.color } as React.CSSProperties}>
            {leading && <span className={styles.crown}>👑</span>}
            <div className={styles.name}>{t.name}</div>
            <div className={styles.score}>{score}</div>
          </div>
        )
      })}
    </div>
  )
}
