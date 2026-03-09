'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGame } from '../../context/GameContext'
import { SECTIONS } from '../../lib/questions'
import { Team, Round } from '../../lib/types'
import styles from './page.module.css'

const DEFAULT_TEAMS: Team[] = [
  { name: 'Team Red',  color: '#C8102E' },
  { name: 'Team Blue', color: '#003580' },
  { name: 'Team Gold', color: '#B8860B' },
]

function SetupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { startGame } = useGame()

  const [section,    setSection]  = useState(SECTIONS[0])
  const [round,      setRound]    = useState<Round>('round1')
  const [pointsPerQ, setPoints]   = useState(10)
  const [teams,      setTeams]    = useState<Team[]>(DEFAULT_TEAMS)

  useEffect(() => {
    const s = params.get('section')
    if (s && SECTIONS.includes(s as typeof SECTIONS[number])) setSection(s as typeof SECTIONS[number])
  }, [params])

  const updateTeam = (i: number, key: keyof Team, val: string) =>
    setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t))

  const handleStart = () => {
    startGame({ section, round, pointsPerQ: Number(pointsPerQ) || 10, teams })
    router.push('/quiz')
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 className={styles.title}>🏆 Game Setup</h1>

      <div className="card">
        {/* Options row */}
        <div className="form-row" style={{ marginBottom: 22 }}>
          <div className="form-group">
            <label className="form-label">Grade Section</label>
            <select value={section} onChange={e => setSection(e.target.value as typeof SECTIONS[number])}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Round Type</label>
            <select value={round} onChange={e => setRound(e.target.value as Round)}>
              <option value="round1">Round 1 — Pick a Number</option>
              <option value="round2">Round 2 — Fastest Fingers</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 130 }}>
            <label className="form-label">Points / Q</label>
            <input type="number" min={1} max={100} value={pointsPerQ}
              onChange={e => setPoints(Number(e.target.value))} />
          </div>
        </div>

        {/* Teams */}
        <p className="form-label" style={{ marginBottom: 12 }}>Team Names & Colours</p>
        <div className={styles.teams}>
          {teams.map((team, i) => (
            <div key={i} className={styles.teamRow}>
              <div className={styles.dot} style={{ background: team.color }} />
              <input
                type="text"
                value={team.name}
                placeholder={`Team ${i + 1}`}
                onChange={e => updateTeam(i, 'name', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="color"
                value={team.color}
                onChange={e => updateTeam(i, 'color', e.target.value)}
                className={styles.colorPicker}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ marginTop: 8 }}>
          🚀 Start Quiz
        </button>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="page" style={{color:'var(--text2)'}}>Loading...</div>}>
      <SetupForm />
    </Suspense>
  )
}