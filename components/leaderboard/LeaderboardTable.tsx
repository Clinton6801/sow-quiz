import { LeaderboardEntry } from '../../lib/scores'
import styles from './LeaderboardTable.module.css'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {
    return <p className={styles.empty}>No results yet. Start a quiz to populate the leaderboard!</p>
  }
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th><th>Team</th><th>Section</th><th>Wins</th><th>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.id} className={i === 0 ? styles.first : ''}>
              <td>{MEDALS[i] ?? i + 1}</td>
              <td><strong>{e.team_name}</strong></td>
              <td><span className={styles.sec}>{e.section}</span></td>
              <td>{e.wins}</td>
              <td><strong className={styles.score}>{e.score}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
