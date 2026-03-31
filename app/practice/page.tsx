'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SECTIONS, CATEGORIES, CATEGORY_ICONS, Section, Category } from '@/lib/questions'
import { getPracticeQuestions, PracticeQuestion } from '@/lib/practice'
import { speakWord, repeatWord } from '@/lib/speech'
import styles from './page.module.css'

type Stage = 'setup' | 'quiz' | 'results'
type AnswerState = 'correct' | 'wrong' | null

function getStars(pct: number): number {
  if (pct >= 90) return 5
  if (pct >= 75) return 4
  if (pct >= 60) return 3
  if (pct >= 40) return 2
  return 1
}

function StarDisplay({ stars, size = 'md' }: { stars: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`${styles.stars} ${size === 'lg' ? styles.starsLg : size === 'sm' ? styles.starsSm : ''}`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= stars ? styles.starOn : styles.starOff}>★</span>
      ))}
    </div>
  )
}

// Normalise answer for comparison — ignore case, extra spaces, punctuation
function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function PracticePage() {
  const router = useRouter()

  const [stage,       setStage]       = useState<Stage>('setup')
  const [studentName, setStudentName] = useState('')
  const [section,     setSection]     = useState<Section>(SECTIONS[0])
  const [category,    setCategory]    = useState<Category>(CATEGORIES[0])
  const [questions,   setQs]          = useState<PracticeQuestion[]>([])
  const [idx,         setIdx]         = useState(0)
  const [showHint,    setShowHint]    = useState(false)
  const [score,       setScore]       = useState(0)
  const [answers,     setAnswers]     = useState<AnswerState[]>([])
  const [loading,     setLoading]     = useState(false)
  const [streak,      setStreak]      = useState(0)
  const [bestStreak,  setBestStreak]  = useState(0)

  // For Spelling Bee — typed input
  const [typed,       setTyped]       = useState('')
  const [submitted,   setSubmitted]   = useState(false)   // true after student submits spelling
  const [isCorrect,   setIsCorrect]   = useState<boolean | null>(null)

  // For non-spelling — revealed flag
  const [revealed,    setRevealed]    = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const current  = questions[idx] ?? null
  const isSpelling = current?.category === 'Spelling Bee'

  // Focus input when a new spelling question loads
  useEffect(() => {
    if (stage === 'quiz' && isSpelling && !submitted) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [idx, stage, isSpelling, submitted])

  // Auto-play word when a new spelling question appears
  useEffect(() => {
    if (stage === 'quiz' && isSpelling && !submitted) {
      speakWord(current?.question ?? '')
    }
  }, [idx, stage])

  const loadAndStart = useCallback(async () => {
    if (!studentName.trim()) return
    setLoading(true)
    try {
      const qs = await getPracticeQuestions(section, category)
      if (qs.length === 0) {
        alert('No practice questions found for this selection.\n\nAsk your teacher to add some in the Admin panel under "Practice Questions".')
        return
      }
      setQs(qs)
      setIdx(0)
      setTyped(''); setSubmitted(false); setIsCorrect(null)
      setRevealed(false); setShowHint(false)
      setScore(0); setStreak(0); setBestStreak(0)
      setAnswers(new Array(qs.length).fill(null))
      setStage('quiz')
    } finally { setLoading(false) }
  }, [section, category, studentName])

  // Shared — advance to next question after a delay
  const advance = (correct: boolean) => {
    const newAnswers = [...answers]
    newAnswers[idx] = correct ? 'correct' : 'wrong'
    setAnswers(newAnswers)
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    setBestStreak(prev => Math.max(prev, newStreak))
    if (correct) setScore(s => s + 1)

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setStage('results')
      } else {
        setIdx(i => i + 1)
        setTyped(''); setSubmitted(false); setIsCorrect(null)
        setRevealed(false); setShowHint(false)
      }
    }, 1400)
  }

  // Spelling Bee — student submits their typed spelling
  const handleSubmitSpelling = () => {
    if (!typed.trim() || !current) return
    const correct = normalise(typed) === normalise(current.answer)
    setIsCorrect(correct)
    setSubmitted(true)
    advance(correct)
  }

  // Non-spelling — self-judge
  const handleSelfJudge = (correct: boolean) => advance(correct)

  const handleGetCertificate = () => {
    const finalPct   = Math.round((score / questions.length) * 100)
    const finalStars = getStars(finalPct)
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    router.push(
      `/practice-certificate?` +
      `name=${encodeURIComponent(studentName.trim())}&` +
      `section=${encodeURIComponent(section)}&` +
      `category=${encodeURIComponent(category)}&` +
      `score=${score}&total=${questions.length}&` +
      `pct=${finalPct}&stars=${finalStars}&` +
      `date=${encodeURIComponent(date)}`
    )
  }

  const pct   = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const stars  = getStars(pct)
  const grade  = pct >= 90 ? { label: 'Excellent! 🌟', color: '#FFD700' }
    : pct >= 75 ? { label: 'Great Job! 🎉',   color: '#00e676' }
    : pct >= 50 ? { label: 'Good Effort! 👍', color: '#00e5ff' }
    : { label: 'Keep Practising! 💪', color: '#ff6d00' }

  // ── SETUP ──
  if (stage === 'setup') return (
    <div className={styles.centered}>
      <div className={styles.setupCard}>
        <div className={styles.setupIcon}>📚</div>
        <h1 className={styles.setupTitle}>Practice Mode</h1>
        <p className={styles.setupSub}>Complete a session to earn your certificate!</p>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Your Name</label>
          <input type="text" value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="e.g. Amara Johnson" maxLength={40}
            onKeyDown={e => e.key === 'Enter' && loadAndStart()} />
          <p className={styles.nameHint}>🏅 Your name will appear on your certificate</p>
        </div>

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

        <button className="btn btn-primary btn-lg" onClick={loadAndStart}
          disabled={loading || !studentName.trim()}
          style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Loading…' : '▶ Start Practice'}
        </button>
        {!studentName.trim() && <p className={styles.nameWarning}>⬆ Enter your name to unlock</p>}
      </div>
    </div>
  )

  // ── QUIZ ──
  if (stage === 'quiz' && current) return (
    <div className={styles.quizWrap}>
      <div className={styles.progressWrap}>
        <div className={styles.progressBar} style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <div className={styles.topStats}>
        <span className={styles.qCount}>{idx + 1} / {questions.length}</span>
        <span className={styles.scoreDisplay}>✅ {score} correct</span>
        {streak >= 2 && <span className={styles.streakBadge}>🔥 {streak} streak!</span>}
      </div>

      <div className={styles.qCard}>
        <div className={styles.qCat}>{CATEGORY_ICONS[current.category]} {current.category}</div>

        {/* ── SPELLING BEE ── */}
        {isSpelling ? (
          <div className={styles.spellingWrap}>
            <p className={styles.spellingLabel}>Listen and type the spelling:</p>

            {/* Audio buttons */}
            <div className={styles.audioBtns}>
              <button className={styles.audioBtn} onClick={() => speakWord(current.question)}>
                🔊 Hear Word
              </button>
              <button className={styles.repeatBtn} onClick={() => repeatWord(current.question)}>
                🔁 Repeat
              </button>
            </div>

            {/* Hint */}
            {current.hint && !submitted && (
              <div className={styles.hintWrap}>
                {!showHint
                  ? <button className={styles.hintBtn} onClick={() => setShowHint(true)}>💡 Show Hint</button>
                  : <div className={styles.hintBox}>💡 {current.hint}</div>
                }
              </div>
            )}

            {/* Typing input — hidden after submission */}
            {!submitted ? (
              <div className={styles.typingWrap}>
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && typed.trim() && handleSubmitSpelling()}
                  placeholder="Type your spelling here…"
                  className={styles.spellingInput}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitSpelling}
                  disabled={!typed.trim()}>
                  Submit ✓
                </button>
              </div>
            ) : (
              /* Result after submission */
              <div className={`${styles.spellingResult} ${isCorrect ? styles.spellingCorrect : styles.spellingWrong}`}>
                <div className={styles.spellingResultIcon}>{isCorrect ? '🎉' : '❌'}</div>
                <div className={styles.spellingResultText}>
                  <p className={styles.spellingYouTyped}>
                    You typed: <strong>{typed}</strong>
                  </p>
                  {!isCorrect && (
                    <p className={styles.spellingCorrectWord}>
                      Correct spelling: <strong>{current.answer}</strong>
                    </p>
                  )}
                  <p className={styles.spellingResultLabel}>
                    {isCorrect ? 'Correct! Well done! 🌟' : 'Not quite — keep practising!'}
                  </p>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── MATHS / GENERAL KNOWLEDGE — self judge ── */
          <>
            <p className={styles.qText}>{current.question}</p>

            {current.hint && !revealed && (
              <div className={styles.hintWrap}>
                {!showHint
                  ? <button className={styles.hintBtn} onClick={() => setShowHint(true)}>💡 Show Hint</button>
                  : <div className={styles.hintBox}>💡 {current.hint}</div>
                }
              </div>
            )}

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
                  <button className={`${styles.judgeBtn} ${styles.correct}`} onClick={() => handleSelfJudge(true)}>✓ Got it!</button>
                  <button className={`${styles.judgeBtn} ${styles.wrong}`}   onClick={() => handleSelfJudge(false)}>✗ Missed it</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.dots}>
        {answers.map((a, i) => (
          <div key={i} className={`${styles.dot}
            ${a === 'correct' ? styles.dotCorrect : a === 'wrong' ? styles.dotWrong : ''}
            ${i === idx ? styles.dotCurrent : ''}`} />
        ))}
      </div>

      <button className="btn btn-ghost btn-sm" onClick={() => setStage('setup')}
        style={{ marginTop: 12, alignSelf: 'center' }}>✕ Quit</button>
    </div>
  )

  // ── RESULTS ──
  if (stage === 'results') return (
    <div className={styles.centered}>
      <div className={styles.resultsCard}>
        <div className={styles.resultIcon}>{pct >= 75 ? '🏆' : pct >= 50 ? '🎯' : '📖'}</div>
        <h1 className={styles.resultGrade} style={{ color: grade.color }}>{grade.label}</h1>

        <StarDisplay stars={stars} size="lg" />
        <p className={styles.starCaption}>{stars} out of 5 stars</p>

        <div className={styles.resultScore}>
          <span className={styles.resultNum} style={{ color: grade.color }}>{score}</span>
          <span className={styles.resultDen}>/ {questions.length}</span>
        </div>
        <div className={styles.resultPct} style={{ color: grade.color }}>{pct}%</div>

        <div className={styles.resultStats}>
          <div className={styles.statBox}><span className={styles.statVal}>{score}</span><span className={styles.statLabel}>Correct</span></div>
          <div className={styles.statBox}><span className={styles.statVal}>{questions.length - score}</span><span className={styles.statLabel}>Missed</span></div>
          <div className={styles.statBox}><span className={styles.statVal}>🔥{bestStreak}</span><span className={styles.statLabel}>Best Streak</span></div>
        </div>

        <div className={styles.certBanner}>
          <div className={styles.certBannerLeft}>
            <span className={styles.certBannerTitle}>🏅 Certificate Ready!</span>
            <span className={styles.certBannerSub}>Print or save it to show your teacher</span>
          </div>
          <button className="btn btn-primary" onClick={handleGetCertificate}>Get Certificate →</button>
        </div>

        <div className={styles.review}>
          <p className={styles.reviewTitle}>Review</p>
          {questions.map((q, i) => (
            <div key={q.id} className={`${styles.reviewRow} ${answers[i] === 'correct' ? styles.reviewCorrect : styles.reviewWrong}`}>
              <span className={styles.reviewIcon}>{answers[i] === 'correct' ? '✓' : '✗'}</span>
              <div className={styles.reviewContent}>
                <p className={styles.reviewQ}>{q.question}</p>
                <p className={styles.reviewA}>→ {q.answer}</p>
                {q.hint && <p className={styles.reviewHint}>💡 {q.hint}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.resultBtns}>
          <button className="btn btn-ghost" onClick={loadAndStart}>🔄 Try Again</button>
          <button className="btn btn-ghost" onClick={() => setStage('setup')}>Change Topic</button>
        </div>
      </div>
    </div>
  )

  return null
}
