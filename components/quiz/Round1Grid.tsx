'use client'
import { useState, useEffect, useCallback } from 'react'
import { useGame } from '../../context/GameContext'
import { getAllForSection, CATEGORIES, CATEGORY_ICONS, Question } from '../../lib/questions'
import QuestionModal from './QuestionModal'
import styles from './Round1Grid.module.css'

interface Props {
  timerSeconds?: number
}

export default function Round1Grid({ timerSeconds }: Props) {
  const { game } = useGame()
  const [grouped, setGrouped] = useState<Record<string, Question[]>>({})
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Question | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllForSection(game.section as any)
      setGrouped(data)
    } finally {
      setLoading(false)
    }
  }, [game.section])

  useEffect(() => { load() }, [load])

  if (loading) return <p style={{ color: 'var(--text2)', padding: '32px 0' }}>Loading questions…</p>

  const allQs = CATEGORIES.flatMap(cat => grouped[cat] || [])
  const totalCount = allQs.length
  const answeredCount = allQs.filter(q => game.answeredQs[q.id]).length
  const allDone = totalCount > 0 && answeredCount === totalCount

  return (
    <div className={styles.wrap}>
      {/* Progress counter */}
      {totalCount > 0 && (
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {answeredCount} / {totalCount} answered
          </span>
        </div>
      )}

      {/* All done banner */}
      {allDone && (
        <div className={styles.allDoneBanner}>
          🎉 All questions answered!
        </div>
      )}

      {CATEGORIES.map(cat => {
        const qs = grouped[cat] || []
        return (
          <div key={cat} className={styles.section}>
            <h3 className={styles.catTitle}>
              {CATEGORY_ICONS[cat]} {cat}
              <span className={styles.count}>{qs.length} Qs</span>
            </h3>
            {qs.length === 0
              ? <p className={styles.empty}>No questions. Add some in Admin →</p>
              : (
                <div className={styles.grid}>
                  {qs.map((q, i) => {
                    const done = game.answeredQs[q.id]
                    return (
                      <button
                        key={q.id}
                        className={`${styles.qBtn} ${done ? styles.done : ''}`}
                        disabled={done}
                        onClick={() => setActive(q)}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              )
            }
          </div>
        )
      })}

      {active && (
        <QuestionModal
          question={active}
          onClose={() => setActive(null)}
          onAwarded={load}
          timerSeconds={timerSeconds}
        />
      )}
    </div>
  )
}
