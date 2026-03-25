'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGame } from '../../context/GameContext'
import { SECTIONS, Section } from '../../lib/questions'
import { Team, Round } from '../../lib/types'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import AdminGate from '../../components/ui/AdminGate'
import styles from './page.module.css'

// Preset colours students can pick from
const PRESET_COLORS = [
  '#C8102E', '#003580', '#FFD700', '#00C853',
  '#00B0FF', '#FF6D00', '#AA00FF', '#F50057',
  '#00BFA5', '#FF4081', '#6200EA', '#1565C0',
]

const DEFAULT_TEAMS: Team[] = [
  { name: 'Team Red',  color: '#C8102E' },
  { name: 'Team Blue', color: '#003580' },
  { name: 'Team Gold', color: '#FFD700' },
]

const MAX_TEAMS = 10

function SetupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { startGame } = useGame()
  const { authed, checked } = useAdminAuth()

  const [showGate,    setShowGate]   = useState(false)
  const [section,     setSection]    = useState<Section>(SECTIONS[0])
  const [round,       setRound]      = useState<Round>('round1')
  const [pointsPerQ,  setPoints]     = useState(10)
  const [teams,       setTeams]      = useState<Team[]>(DEFAULT_TEAMS)
  const [colorPicker, setColorPicker] = useState<number | null>(null) // which row is open

  useEffect(() => {
    const s = params.get('section')
    if (s && SECTIONS.includes(s as Section)) setSection(s as Section)
  }, [params])

  const updateTeam = (i: number, key: keyof Team, val: string) =>
    setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t))

  const addTeam = () => {
    if (teams.length >= MAX_TEAMS) return
    const nextColor = PRESET_COLORS[teams.length % PRESET_COLORS.length]
    setTeams(prev => [...prev, { name: '', color: nextColor }])
  }

  const removeTeam = (i: number) => {
    if (teams.length <= 2) return // minimum 2
    setTeams(prev => prev.filter((_, idx) => idx !== i))
    if (colorPicker === i) setColorPicker(null)
  }

  const handleStartClick = () => {
    // Validate — all teams need a name
    const empty = teams.findIndex(t => !t.name.trim())
    if (empty !== -1) {
      alert(`Please enter a name for Team ${empty + 1}`)
      return
    }
    if (authed) doStart()
    else setShowGate(true)
  }

  const doStart = () => {
    startGame({ section, round, pointsPerQ: Number(pointsPerQ) || 10, teams })
    router.push('/quiz')
  }

  if (!checked) return null

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {showGate && (
        <AdminGate
          title="Host Access Required"
          subtitle="Enter the admin password to start a Solo Quiz"
          onAuthed={() => { setShowGate(false); doStart() }}
          onCancel={() => setShowGate(false)}
        />
      )}

      <h1 className={styles.title}>🏆 Game Setup</h1>

      <div className="card">
        {/* Options row */}
        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Grade Section</label>
            <select value={section} onChange={e => setSection(e.target.value as Section)}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Round Type</label>
            <select value={round} onChange={e => setRound(e.target.value as Round)}>
              <option value="round1">Round 1 — Pick a Number</option>
              <option value="round2">Round 2 — Fastest Fingers</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label className="form-label">Points / Q</label>
            <input type="number" min={1} max={100} value={pointsPerQ}
              onChange={e => setPoints(Number(e.target.value))} />
          </div>
        </div>

        {/* Participants header */}
        <div className={styles.teamsHeader}>
          <p className="form-label" style={{ margin: 0 }}>
            Participants
            <span className={styles.teamCount}>{teams.length} / {MAX_TEAMS}</span>
          </p>
          <button
            className={styles.addBtn}
            onClick={addTeam}
            disabled={teams.length >= MAX_TEAMS}
            type="button">
            + Add Participant
          </button>
        </div>

        {/* Team list */}
        <div className={styles.teams}>
          {teams.map((team, i) => (
            <div key={i} className={styles.teamRow}>
              {/* Position number */}
              <span className={styles.teamNum}>{i + 1}</span>

              {/* Colour swatch — click to open picker */}
              <button
                className={styles.swatchBtn}
                style={{ background: team.color }}
                onClick={() => setColorPicker(colorPicker === i ? null : i)}
                type="button"
                title="Change colour"
              />

              {/* Name input */}
              <input
                type="text"
                value={team.name}
                placeholder={`Participant / Team ${i + 1}`}
                onChange={e => updateTeam(i, 'name', e.target.value)}
                className={styles.nameInput}
                maxLength={30}
              />

              {/* Remove button */}
              <button
                className={styles.removeBtn}
                onClick={() => removeTeam(i)}
                disabled={teams.length <= 2}
                type="button"
                title="Remove">
                ✕
              </button>

              {/* Colour picker dropdown */}
              {colorPicker === i && (
                <div className={styles.colorDropdown}>
                  <p className={styles.colorDropdownLabel}>Pick a colour</p>
                  <div className={styles.colorGrid}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        className={`${styles.colorDot} ${team.color === c ? styles.colorDotActive : ''}`}
                        style={{ background: c }}
                        onClick={() => { updateTeam(i, 'color', c); setColorPicker(null) }}
                        type="button"
                      />
                    ))}
                  </div>
                  {/* Custom colour */}
                  <div className={styles.customColorRow}>
                    <span className={styles.customColorLabel}>Custom:</span>
                    <input
                      type="color"
                      value={team.color}
                      onChange={e => updateTeam(i, 'color', e.target.value)}
                      className={styles.colorPicker}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length < MAX_TEAMS && (
          <button className={styles.addBtnBottom} onClick={addTeam} type="button">
            + Add Another Participant
          </button>
        )}

        <div className={styles.startRow}>
          <button className="btn btn-primary btn-lg" onClick={handleStartClick}>
            🚀 Start Quiz ({teams.length} participants)
          </button>
          {!authed && <p className={styles.lockNote}>🔒 Admin password required</p>}
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <SetupForm />
    </Suspense>
  )
}
