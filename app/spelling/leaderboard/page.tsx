'use client'

/**
 * /spelling/leaderboard — Spelling Bee leaderboard.
 * Tabs: This Week / This Month / All Time
 * Section filter dropdown
 * Table: Rank, Name, Section, Score, Best Streak
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SECTIONS } from '@/lib/questions'
import styles from './page.module.css'

type TimeFilter = 'week' | 'month' | 'all'

interface ScoreRow {
  id: string
  player_name: string
  section: string
  score: number
  streak: number
  accuracy: number
  created_at: string
}

const SECTION_FILTERS = ['All Sections', ...SECTIONS]
const RANK_MEDALS     = ['🥇', '🥈', '🥉']

function getDateCutoff(filter: TimeFilter): string | null {
  if (filter === 'all') return null
  const d = new Date()
  if (filter === 'week')  d.setDate(d.getDate() - 7)
  if (filter === 'month') d.setMonth(d.getMonth() - 1)
  return d.toISOString()
}

export default function SpellingLeaderboardPage() {
  const [timeFilter,    setTimeFilter]    = useState<TimeFilter>('week')
  const [sectionFilter, setSectionFilter] = useState('All Sections')
  const [scores,        setScores]        = useState<ScoreRow[]>([])
  const [loading,       setLoading]       = useState(true)

  const loadScores = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('spelling_scores')
      .select('id, player_name, section, score, streak, accuracy, created_at')
      .order('score', { ascending: false })
      .limit(50)

    const cutoff = getDateCutoff(timeFilter)
    if (cutoff) query = query.gte('created_at', cutoff)

    if (sectionFilter !== 'All Sections') query = query.eq('section', sectionFilter)

    const { data } = await query
    setScores((data ?? []) as ScoreRow[])
    setLoading(false)
  }, [timeFilter, sectionFilter])

  useEffect(() => { loadScores() }, [loadScores])

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/spelling" className="btn btn-ghost btn-sm">← Back</Link>
        </div>
        <h1 className={styles.title}>🏆 Spelling Leaderboard</h1>
        <div className={styles.headerRight} />
      </div>

      {/* Time filter tabs */}
      <div className={styles.timeFilters}>
        {(['week', 'month', 'all'] as TimeFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`${styles.timeFb} ${timeFilter === f ? styles.timeActive : ''}`}
          >
            {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Section filter */}
      <div className={styles.sectionFilter}>
        <select
          value={sectionFilter}
          onChange={e => setSectionFilter(e.target.value)}
          className={styles.sectionSelect}
        >
          {SECTION_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : scores.length === 0 ? (
        <div className={styles.empty}>
          <p>No scores yet for this filter.</p>
          <Link href="/spelling/play" className="btn btn-gold btn-sm" style={{ marginTop: 16 }}>
            Be the first! Play now →
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Section</th>
                <th>Score</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row, i) => (
                <tr key={row.id} className={i === 0 ? styles.firstRow : ''}>
                  <td>{RANK_MEDALS[i] ?? i + 1}</td>
                  <td><strong>{row.player_name}</strong></td>
                  <td><span className={styles.sectionTag}>{row.section}</span></td>
                  <td><strong className={styles.scoreVal}>{row.score}</strong></td>
                  <td className={styles.streakVal}>{row.streak > 0 ? `${row.streak}🔥` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
