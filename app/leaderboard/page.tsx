'use client'
import { useState, useEffect } from 'react'
import { getLeaderboard, resetLeaderboard, LeaderboardEntry } from '../../lib/scores'
import { useToast } from '../../context/ToastContext'
import LeaderboardTable from '../../components/leaderboard/LeaderboardTable'
import styles from './page.module.css'

const SECTION_FILTERS = ['All', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']
const TIME_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

export default function LeaderboardPage() {
  const { showToast } = useToast()
  const [entries,  setEntries]  = useState<LeaderboardEntry[]>([])
  const [section,  setSection]  = useState('All')
  const [period,   setPeriod]   = useState('all')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { load() }, [section, period])

  const load = async () => {
    setLoading(true)
    try {
      let data = await getLeaderboard(section === 'All' ? undefined : section)
      // Client-side time filter (avoids needing new API)
      if (period !== 'all') {
        const now = Date.now()
        const cutoff = period === 'week'
          ? now - 7 * 24 * 60 * 60 * 1000
          : now - 30 * 24 * 60 * 60 * 1000
        data = data.filter(e => new Date(e.created_at).getTime() >= cutoff)
      }
      setEntries(data)
    } catch {
      showToast('Error loading leaderboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm(`Reset leaderboard for "${section}"?`)) return
    try {
      await resetLeaderboard(section === 'All' ? undefined : section)
      showToast('Reset!', 'success')
      load()
    } catch { showToast('Error', 'error') }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Leaderboard</h1>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset</button>
      </div>

      {/* Time period filter */}
      <div className={styles.timeFilters}>
        {TIME_FILTERS.map(f => (
          <button key={f.value}
            className={`${styles.timeFb} ${period === f.value ? styles.timeActive : ''}`}
            onClick={() => setPeriod(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Section filter */}
      <div className={styles.filters}>
        {SECTION_FILTERS.map(f => (
          <button key={f}
            className={`${styles.fb} ${section === f ? styles.active : ''}`}
            onClick={() => setSection(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading
        ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
        : entries.length === 0
          ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No entries for this period yet.</p>
          : <LeaderboardTable entries={entries} />
      }
    </div>
  )
}
