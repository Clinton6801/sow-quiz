'use client'
import { useState, useEffect } from 'react'
import { getLeaderboard, resetLeaderboard, LeaderboardEntry } from '@/lib/scores'
import { useToast } from '@/context/ToastContext'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import AdminGate from '@/components/ui/AdminGate'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import styles from './page.module.css'

const SECTION_FILTERS = ['All', 'Sprout 2/3', 'Stepping Stone & Grade 1', 'Grade 2/3', 'Grade 4/5', 'JSS 1–3', 'SS 1–2']

const TIME_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

export default function LeaderboardPage() {
  const { showToast } = useToast()
  const { authed, login } = useAdminAuth()
  const [entries,   setEntries]   = useState<LeaderboardEntry[]>([])
  const [section,   setSection]   = useState('All')
  const [period,    setPeriod]    = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [showGate,  setShowGate]  = useState(false)

  useEffect(() => { load() }, [section, period])

  const load = async () => {
    setLoading(true)
    try {
      let data = await getLeaderboard(section === 'All' ? undefined : section)
      if (period !== 'all') {
        const now    = Date.now()
        const cutoff = period === 'week' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000
        data = data.filter(e => new Date(e.created_at).getTime() >= cutoff)
      }
      setEntries(data)
    } catch { showToast('Error loading leaderboard', 'error') }
    finally { setLoading(false) }
  }

  const doReset = async () => {
    if (!confirm(`Reset leaderboard for "${section}"?`)) return
    try {
      await resetLeaderboard(section === 'All' ? undefined : section)
      showToast('Reset!', 'success')
      load()
    } catch { showToast('Error', 'error') }
  }

  const handleResetClick = () => {
    if (authed) { doReset() } else { setShowGate(true) }
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      {showGate && (
        <AdminGate
          title="Admin Required"
          subtitle="Enter the admin password to reset the leaderboard"
          onAuthed={() => { setShowGate(false); doReset() }}
          onCancel={() => setShowGate(false)}
        />
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Leaderboard</h1>
        <button className="btn btn-danger btn-sm" onClick={handleResetClick}>
          🗑 Reset {!authed && '🔒'}
        </button>
      </div>

      <div className={styles.timeFilters}>
        {TIME_FILTERS.map(f => (
          <button key={f.value}
            className={`${styles.timeFb} ${period === f.value ? styles.timeActive : ''}`}
            onClick={() => setPeriod(f.value)}>{f.label}</button>
        ))}
      </div>

      <div className={styles.filters}>
        {SECTION_FILTERS.map(f => (
          <button key={f}
            className={`${styles.fb} ${section === f ? styles.active : ''}`}
            onClick={() => setSection(f)}>{f}</button>
        ))}
      </div>

      {loading
        ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
        : entries.length === 0
          ? <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>No entries yet.</p>
          : <LeaderboardTable entries={entries} />
      }
    </div>
  )
}
