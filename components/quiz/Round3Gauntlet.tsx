'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useGame } from '../../context/GameContext'
import { useToast } from '../../context/ToastContext'
import { getQuestionsByDifficulty, CATEGORIES, CATEGORY_ICONS, Question } from '../../lib/questions'
import { upsertScore } from '../../lib/scores'
import { Team } from '../../lib/types'
import styles from './Round3Gauntlet.module.css'

type Stage = 'easy' | 'moderate' | 'hard' | 'champion'
type GauntletPhase = 'setup' | 'category' | 'playing'

const STAGE_POINTS: Record<Stage, number> = {
  easy: 5,
  moderate: 10,
  hard: 20,
  champion: 40,
}

const STAGE_COLORS: Record<Stage, string> = {
  easy: '#00e676',
  moderate: '#FFD700',
  hard: '#FF6D00',
  champion: '#C8102E',
}

const STAGE_LABELS: Record<Stage, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  champion: 'Champion',
}

export default function Round3Gauntlet() {
  const { game, awardPoints } = useGame()
  const { showToast } = useToast()

  // Phase management
  const [phase, setPhase] = useState<GauntletPhase>('setup')
  const [participants, setParticipants] = useState<number>(1)
  const [category, setCategory] = useState<string | null>(null)

  // Game state
  const [stage, setStage] = useState<Stage>('easy')
  const [shuffledQs, setShuffledQs] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const [buzzed, setBuzzed] = useState<Team | null>(null)
  const [locked, setLocked] = useState(false)
  const [pct, setPct] = useState(100)
  const [stageStats, setStageStats] = useState<Record<Stage, { attempted: number; correct: number; points: number }>>({
    easy: { attempted: 0, correct: 0, points: 0 },
    moderate: { attempted: 0, correct: 0, points: 0 },
    hard: { attempted: 0, correct: 0, points: 0 },
    champion: { attempted: 0, correct: 0, points: 0 },
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = currentIdx >= 0 && currentIdx < shuffledQs.length ? shuffledQs[currentIdx] : null

  // Load questions for current stage
  const loadStageQuestions = useCallback(async () => {
    if (!category) return
    try {
      const qs = await getQuestionsByDifficulty(game.section as any, stage, category as any)
      const shuffled = [...qs].sort(() => Math.random() - 0.5)
      setShuffledQs(shuffled)
      setCurrentIdx(-1)
      setBuzzed(null)
      setLocked(false)
      setRevealed(false)
    } catch (err) {
      showToast('Error loading questions', 'error')
      console.error(err)
    }
  }, [game.section, stage, category, showToast])

  useEffect(() => {
    if (phase === 'playing') loadStageQuestions()
  }, [phase, stage, loadStageQuestions])

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    let v = 100
    setPct(100)
    timerRef.current = setInterval(() => {
      v -= 0.5
      setPct(Math.max(0, v))
      if (v <= 0) {
        clearInterval(timerRef.current!)
        setRevealed(true)
        showToast("⏰ Time's up!", 'info')
      }
    }, 50)
  }

  const drawQuestion = () => {
    if (currentIdx >= shuffledQs.length - 1) {
      return
    }
    const n = currentIdx + 1
    setCurrentIdx(n)
    setBuzzed(null)
    setLocked(false)
    setRevealed(false)
    startTimer()
  }

  const handleBuzz = (team: Team) => {
    if (locked || currentIdx < 0) return
    if (timerRef.current) clearInterval(timerRef.current)
    setLocked(true)
    setBuzzed(team)
  }

  const judge = async (team: Team, correct: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const pts = STAGE_POINTS[stage]
    if (correct) {
      awardPoints(team.name, pts)
      setStageStats(s => ({
        ...s,
        [stage]: {
          attempted: s[stage].attempted + 1,
          correct: s[stage].correct + 1,
          points: s[stage].points + pts,
        },
      }))
      await upsertScore({ teamName: team.name, section: game.section, addScore: pts, addWin: true }).catch(console.error)
      showToast(`✅ +${pts} → ${team.name}!`, 'success')
    } else {
      setStageStats(s => ({
        ...s,
        [stage]: { ...s[stage], attempted: s[stage].attempted + 1 },
      }))
      showToast(`❌ Wrong — no points for ${team.name}`, 'error')
    }
    setBuzzed(null)
    setLocked(false)
  }

  const nextStage = () => {
    const stages: Stage[] = ['easy', 'moderate', 'hard', 'champion']
    const idx = stages.indexOf(stage)
    if (idx < stages.length - 1) {
      setStage(stages[idx + 1])
      setCurrentIdx(-1)
      setRevealed(false)
    }
  }

  const timerColor = pct > 60 ? 'var(--green)' : pct > 28 ? 'var(--gold)' : 'var(--danger)'

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <div className={styles.wrap}>
        <div className={styles.setupCard}>
          <h2 className={styles.setupTitle}>🎯 Round 3 — Gauntlet Setup</h2>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">How many participants are in this round?</label>
            <input
              type="number"
              min="1"
              value={participants}
              onChange={e => setParticipants(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ fontSize: '1.1rem', padding: '12px' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setPhase('category')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Begin Gauntlet
          </button>
        </div>
      </div>
    )
  }

  // ── CATEGORY PHASE ──
  if (phase === 'category') {
    return (
      <div className={styles.wrap}>
        <div className={styles.setupCard}>
          <h2 className={styles.setupTitle}>📚 Select Category</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 20, textAlign: 'center' }}>
            Participants: <span style={{ color: '#00e5ff', fontWeight: 800 }}>{participants}</span>
          </p>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={styles.categoryBtn}
                onClick={() => {
                  setCategory(cat)
                  setPhase('playing')
                }}
              >
                <span className={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</span>
                <span className={styles.categoryName}>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYING PHASE ──
  if (phase === 'playing') {
    const stages: Stage[] = ['easy', 'moderate', 'hard', 'champion']
    const stageIdx = stages.indexOf(stage)
    const questionsRemaining = shuffledQs.length - currentIdx - 1
    const allShown = currentIdx >= shuffledQs.length - 1

    return (
      <div className={styles.wrap}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.stageIndicator}>
            {stages.map((s, i) => (
              <div
                key={s}
                className={styles.stageNode}
                style={{
                  backgroundColor: i === stageIdx ? STAGE_COLORS[s] : 'rgba(255,255,255,0.2)',
                  color: i === stageIdx ? '#000' : 'rgba(255,255,255,0.5)',
                }}
                title={STAGE_LABELS[s]}
              >
                {s === 'easy' ? '●' : s === 'moderate' ? '○' : s === 'hard' ? '○' : '○'}
              </div>
            ))}
          </div>
          <div className={styles.categoryLabel}>{category ? `${CATEGORY_ICONS[category as 'Maths' | 'Spelling Bee' | 'General Knowledge']} ${category}` : ''}</div>
          <div className={styles.participantLabel} style={{ color: '#00e5ff' }}>👥 {participants}</div>
        </div>

        {/* Points badge */}
        <div className={styles.pointsBadge} style={{ backgroundColor: STAGE_COLORS[stage] }}>
          {STAGE_POINTS[stage]} pts
        </div>

        {/* Question counter */}
        <div className={styles.counter}>
          Question {Math.max(0, currentIdx + 1)} of {shuffledQs.length}
        </div>

        {/* Question box */}
        <div className={styles.qBox}>
          {!current ? (
            <p className={styles.placeholder}>Press <strong>Draw Question</strong> to begin!</p>
          ) : (
            <>
              <div className={styles.qCat}>
                {current.category === 'Maths' ? '📐' : current.category === 'Spelling Bee' ? '🐝' : '🌍'}
                &nbsp;{current.category}
              </div>
              {current.category === 'Spelling Bee' ? (
                <div className={styles.spellingWrap}>
                  <p className={styles.spellingLabel}>Spell the word:</p>
                  <div className={`${styles.spellingWord} ${revealed ? styles.unblurred : ''}`}>
                    {current.question}
                  </div>
                  {!revealed && <p className={styles.blurHint}>👆 Hidden — use audio for contestants</p>}
                </div>
              ) : (
                <p className={styles.qText}>{current.question}</p>
              )}
              {current.category === 'Spelling Bee' && (
                <button
                  className={styles.audioBtn}
                  onClick={() => {
                    if (!window.speechSynthesis) return
                    window.speechSynthesis.cancel()
                    const u = new SpeechSynthesisUtterance(current.question)
                    u.rate = 0.75
                    window.speechSynthesis.speak(u)
                  }}
                >
                  🔊 Hear the Word
                </button>
              )}
              {current.hint && (
                <div className={styles.hintBox}>
                  💡 Hint: {current.hint}
                </div>
              )}
            </>
          )}
        </div>

        {/* Timer */}
        <div className={styles.timerWrap}>
          <div className={styles.timerBar} style={{ width: `${pct}%`, background: timerColor }} />
        </div>

        {/* Buzz buttons */}
        <div className={styles.buzzRow}>
          {game.teams.map(t => (
            <button
              key={t.name}
              className={`${styles.buzzBtn} ${buzzed?.name === t.name ? styles.buzzed : ''}`}
              style={{ '--tc': t.color } as React.CSSProperties}
              onClick={() => handleBuzz(t)}
              disabled={locked || currentIdx < 0}
            >
              <span className={styles.buzzIcon}>🔔</span>
              <span className={styles.buzzLabel}>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Judge panel */}
        {buzzed && (
          <div className={styles.judgeBox} style={{ borderColor: buzzed.color }}>
            <p style={{ color: buzzed.color, fontWeight: 800, marginBottom: 12 }}>
              🔔 {buzzed.name} buzzed first!
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-green btn-sm" onClick={() => judge(buzzed, true)}>
                ✓ Correct
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => judge(buzzed, false)}>
                ✗ Wrong
              </button>
            </div>
          </div>
        )}

        {/* Answer reveal */}
        {revealed && current && (
          <div className={styles.answerReveal}>
            Answer: <strong>{current.answer}</strong>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          {allShown ? (
            <div className={styles.allShownMsg}>✅ All {shuffledQs.length} questions in this stage have been shown</div>
          ) : (
            <button className="btn btn-gold" onClick={drawQuestion}>
              ▶ Draw Question
            </button>
          )}
          {current && !revealed && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setRevealed(true)
              }}
            >
              👁 Reveal Answer
            </button>
          )}
          {stageIdx < 3 && (
            <button
              className={`btn btn-primary btn-sm ${allShown ? styles.nextStagePulsing : ''}`}
              onClick={nextStage}
            >
              ▶ Next Stage
            </button>
          )}
          {stageIdx === 3 && (
            <button className="btn btn-primary btn-sm" onClick={() => setPhase('setup')}>
              🏁 End Gauntlet
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
