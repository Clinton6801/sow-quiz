'use client'
import { useState, useEffect, useCallback } from 'react'
import { SECTIONS, CATEGORIES, CATEGORY_ICONS, getQuestions, Section, Category, Question } from '@/lib/questions'
import styles from './page.module.css'

type Stage = 'setup' | 'quiz' | 'results'

export default function PracticePage() {
  const [stage,    setStage]    = useState<Stage>('setup')
  const [section,  setSection]  = useState<Section>(SECTIONS[0])
  const [category, setCategory] = useState<Category>(CATEGORIES[0])
  const [questions, setQs]      = useState<Question[]>([])
  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState(0)
  const [answers,  setAnswers]  = useState<('correct'|'wrong'|null)[]>([])
  const [loading,  setLoading]  = useState(false)
  const [streak,   setStreak]   = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const current = questions[idx] ?? null

  const loadAndStart = useCallback(async () => {
    setLoading(true)
    try {
      const qs = await getQuestions(section, category)
      if (qs.length === 0) { alert('No questions found for this selection. Add some in Admin first.'); return }
      const shuffled = [...qs].sort(() => Math.random() - 0.5)
      setQs(shuffled)
      setIdx(0)
      setRevealed(false)
      setScore(0)
      setStreak(0)
      setBestStreak(0)
      setAnswers(new Array(shuffled.length).fill(null))
      setStage('quiz')
    } finally {
      setLoading(false)
    }
  }, [section, category])

  const handleAnswer = (correct: boolean) => {
    const newAnswers = [...answers]
    newAnswers[idx] = correct ? 'correct' : 'wrong'
    setAnswers(newAnswers)

    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    setBestStreak(prev => Math.max(prev, newStreak))
    if (correct) setScore(s => s + 1)

    // Auto-advance after short delay
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setStage('results')
      } else {
        setIdx(i => i + 1)
        setRevealed(false)
      }
    }, 800)
  }

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const grade = pct >= 90 ? { label: 'Excellent! 🌟', color: '#FFD700' }
    : pct >= 75 ? { label: 'Great Job! 🎉', color: '#00e676' }
    : pct >= 50 ? { label: 'Good Effort! 👍', color: '#00e5ff' }
    : { label: 'Keep Practising! 💪', color: '#ff6d00' }

  // ── SETUP ──
  if (stage === 'setup') return (
    <div className={styles.centered}>
      <div className={styles.setupCard}>
        <div className={styles.setupIcon}>📚</div>
        <h1 className={styles.setupTitle}>Practice Mode</h1>
        <p className={styles.setupSub}>Study at your own pace — no host needed</p>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Grade Section</label>
          <select value={section} onChange={e => setSection(e.target.value as Section)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 28 }}>
          <label className="form-label">Category</label>
          <div className={styles.catPicker}>
            {CATEGORIES.map(c => (
              <button key={c}
                className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`}
                onClick={() => setCategory(c)}>
                {CATEGORY_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={loadAndStart} disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Loading…' : '▶ Start Practice'}
        </button>
      </div>
    </div>
  )

  // ── QUIZ ──
  if (stage === 'quiz' && current) return (
    <div className={styles.quizWrap}>
      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      {/* Top stats */}
      <div className={styles.topStats}>
        <span className={styles.qCount}>{idx + 1} / {questions.length}</span>
        <span className={styles.scoreDisplay}>✅ {score} correct</span>
        {streak >= 2 && <span className={styles.streakBadge}>🔥 {streak} streak!</span>}
      </div>

      {/* Question card */}
      <div className={styles.qCard}>
        <div className={styles.qCat}>{CATEGORY_ICONS[current.category]} {current.category}</div>

        {current.category === 'Spelling Bee' ? (
          <div className={styles.spellingWrap}>
            <p className={styles.spellingLabel}>Spell the word:</p>
            <div className={`${styles.spellingWord} ${revealed ? styles.unblurred : ''}`}>
              {current.question}
            </div>
            {!revealed && (
              <button className={styles.audioBtn} onClick={() => {
                if (!window.speechSynthesis) return
                window.speechSynthesis.cancel()
                const u = new SpeechSynthesisUtterance(current.question)
                u.rate = 0.75; window.speechSynthesis.speak(u)
              }}>🔊 Hear the Word</button>
            )}
          </div>
        ) : (
          <p className={styles.qText}>{current.question}</p>
        )}

        {/* Answer reveal */}
        {!revealed ? (
          <button className="btn btn-ghost" onClick={() => setRevealed(true)} style={{ marginTop: 16 }}>
            👁 Show Answer
          </button>
        ) : (
          <div className={styles.answerSection}>
            <div className={styles.answerBox}>
              <span className={styles.answerLabel}>Answer:</span>
              <span className={styles.answerVal}>{current.answer}</span>
            </div>
            <p className={styles.selfJudge}>Did you get it right?</p>
            <div className={styles.judgeRow}>
              <button className={`${styles.judgeBtn} ${styles.correct}`} onClick={() => handleAnswer(true)}>
                ✓ Got it!
              </button>
              <button className={`${styles.judgeBtn} ${styles.wrong}`} onClick={() => handleAnswer(false)}>
                ✗ Missed it
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Answer history dots */}
      <div className={styles.dots}>
        {answers.map((a, i) => (
          <div key={i} className={`${styles.dot}
            ${a === 'correct' ? styles.dotCorrect : a === 'wrong' ? styles.dotWrong : ''}
            ${i === idx ? styles.dotCurrent : ''}`}
          />
        ))}
      </div>

      <button className="btn btn-ghost btn-sm" onClick={() => setStage('setup')}
        style={{ marginTop: 16, alignSelf: 'center' }}>
        ✕ Quit
      </button>
    </div>
  )

  // ── RESULTS ──
  if (stage === 'results') return (
    <div className={styles.centered}>
      <div className={styles.resultsCard}>
        <div className={styles.resultIcon}>
          {pct >= 75 ? '🏆' : pct >= 50 ? '🎯' : '📖'}
        </div>
        <h1 className={styles.resultGrade} style={{ color: grade.color }}>{grade.label}</h1>

        <div className={styles.resultScore}>
          <span className={styles.resultNum} style={{ color: grade.color }}>{score}</span>
          <span className={styles.resultDen}>/ {questions.length}</span>
        </div>
        <div className={styles.resultPct} style={{ color: grade.color }}>{pct}%</div>

        <div className={styles.resultStats}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{score}</span>
            <span className={styles.statLabel}>Correct</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{questions.length - score}</span>
            <span className={styles.statLabel}>Missed</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>🔥{bestStreak}</span>
            <span className={styles.statLabel}>Best Streak</span>
          </div>
        </div>

        {/* Per-question review */}
        <div className={styles.review}>
          <p className={styles.reviewTitle}>Review</p>
          {questions.map((q, i) => (
            <div key={q.id} className={`${styles.reviewRow} ${answers[i] === 'correct' ? styles.reviewCorrect : styles.reviewWrong}`}>
              <span className={styles.reviewIcon}>{answers[i] === 'correct' ? '✓' : '✗'}</span>
              <div className={styles.reviewContent}>
                <p className={styles.reviewQ}>{q.question}</p>
                <p className={styles.reviewA}>→ {q.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.resultBtns}>
          <button className="btn btn-primary" onClick={loadAndStart}>🔄 Try Again</button>
          <button className="btn btn-ghost" onClick={() => setStage('setup')}>Change Topic</button>
        </div>
      </div>
    </div>
  )

  return null
}
