'use client'
import { useState, useEffect } from 'react'
import { getLeaderboard, resetLeaderboard, LeaderboardEntry } from '../../lib/scores'
import { useToast } from '../../context/ToastContext'
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable'
import styles from './page.module.css'

const FILTERS = ['All', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']

export default function LeaderboardPage() {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [filter,  setFilter]  = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      setEntries(await getLeaderboard(filter))
    } catch {
      showToast('Error loading leaderboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm(`Reset leaderboard for "${filter}"?`)) return
    try {
      await resetLeaderboard(filter === 'All' ? undefined : filter)
      showToast('Reset!', 'success')
      load()
    } catch {
      showToast('Error', 'error')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Leaderboard</h1>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset</button>
      </div>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`${styles.fb} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading
        ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
        : <LeaderboardTable entries={entries} />
      }
    </div>
  )
}
