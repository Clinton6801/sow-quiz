'use client'

/**
 * /spelling/play — Active spelling game.
 *
 * Flow:
 * 1. Load 10 random words for the player's section from Supabase
 * 2. Show masked word (e.g. A _ I _ A L), 🔊 Hear Word button, optional hint, text input
 * 3. 15-second countdown per word — auto-advance on timeout (0 pts)
 * 4. Streak multiplier: 1×, 1.5×, 2×, 2.5×, 3×
 * 5. After 10 words → /spelling/end
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { speakWord, repeatWord, playWordAudio } from '@/lib/speech'
import { maskWordChars, normaliseAnswer, calcPoints, streakMultiplier } from '@/lib/spelling'
import styles from './page.module.css'

const TOTAL_WORDS    = 10
const TIMER_SECONDS  = 15

interface SpellingWord {
  id: string
  word: string
  section: string
  hint: string | null
  audio_url: string | null
}

type FeedbackState = 'idle' | 'correct' | 'wrong' | 'timeout'

export default function SpellingPlayPage() {
  const router = useRouter()

  const [words,        setWords]        = useState<SpellingWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer,       setAnswer]       = useState('')
  const [score,        setScore]        = useState(0)
  const [streak,       setStreak]       = useState(0)
  const [bestStreak,   setBestStreak]   = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(TIMER_SECONDS)
  const [feedback,     setFeedback]     = useState<FeedbackState>('idle')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [playerName,   setPlayerName]   = useState('')
  const [speaking,     setSpeaking]     = useState(false)

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const advancingRef = useRef(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  // Refs to track latest values for use in advance() without stale closure issues
  const scoreRef        = useRef(0)
  const bestStreakRef   = useRef(0)
  const correctCountRef = useRef(0)

  // ── Load player info + words ──────────────────────────────────────────────

  useEffect(() => {
    const name = sessionStorage.getItem('spelling_player') ?? ''
    const sec  = sessionStorage.getItem('spelling_section') ?? ''

    if (!name || !sec) { router.replace('/spelling'); return }

    setPlayerName(name)
    loadWords(sec)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadWords(sec: string) {
    setLoading(true)
    let query = supabase.from('spelling_words').select('id, word, section, hint, audio_url')
    if (sec !== 'All Sections') query = query.eq('section', sec)

    const { data, error: dbErr } = await query

    if (dbErr || !data || data.length === 0) {
      setError('No words found for this section. Ask your admin to add spelling words.')
      setLoading(false)
      return
    }

    console.log('[loadWords] Fetched words:', data.slice(0, 3))

    const shuffled = [...data].sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, TOTAL_WORDS) as SpellingWord[]
    console.log('[loadWords] Selected words with audio_url:', selectedWords.map(w => ({ word: w.word, audio_url: w.audio_url })))
    setWords(selectedWords)
    setLoading(false)
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (advancingRef.current) return
    advancingRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setFeedback('timeout')
    setStreak(0)
    setTimeout(() => advance(), 2400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(TIMER_SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleTimeout])

  // Start timer + auto-speak when a new word loads
  useEffect(() => {
    if (!loading && words.length > 0 && feedback === 'idle') {
      advancingRef.current = false
      startTimer()
      const t = setTimeout(() => {
        if (words[currentIndex]) playWordAudio(words[currentIndex].word, words[currentIndex].audio_url)
      }, 500)
      return () => {
        clearTimeout(t)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loading, words.length])

  // Focus input when word loads
  useEffect(() => {
    if (!loading && feedback === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [currentIndex, loading, feedback])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (feedback !== 'idle' || advancingRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)

    const current = words[currentIndex]
    if (!current) return

    const isCorrect = normaliseAnswer(answer) === normaliseAnswer(current.word)

    if (isCorrect) {
      const newStreak = streak + 1
      const pts = calcPoints(newStreak)
      setStreak(newStreak)
      setBestStreak(prev => {
        const next = Math.max(prev, newStreak)
        bestStreakRef.current = next
        return next
      })
      setScore(prev => {
        const next = prev + pts
        scoreRef.current = next
        return next
      })
      setCorrectCount(prev => {
        const next = prev + 1
        correctCountRef.current = next
        return next
      })
      setFeedback('correct')
    } else {
      setStreak(0)
      setFeedback('wrong')
    }

    advancingRef.current = true
    setTimeout(() => advance(), 2000)
  }

  function advance() {
    setAnswer('')
    setFeedback('idle')
    advancingRef.current = false

    const nextIndex = currentIndex + 1
    if (nextIndex >= words.length) {
      // Use refs to get the latest values (state updates are async)
      const finalScore   = scoreRef.current
      const finalStreak  = bestStreakRef.current
      const finalCorrect = correctCountRef.current
      const accuracy     = Math.round((finalCorrect / words.length) * 100)
      sessionStorage.setItem('spelling_score',    String(finalScore))
      sessionStorage.setItem('spelling_streak',   String(finalStreak))
      sessionStorage.setItem('spelling_accuracy', String(accuracy))
      sessionStorage.setItem('spelling_correct',  String(finalCorrect))
      router.push('/spelling/end')
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  async function handleHearWord() {
    if (!words[currentIndex]) return
    setSpeaking(true)
    await playWordAudio(words[currentIndex].word, words[currentIndex].audio_url)
    setTimeout(() => setSpeaking(false), 1800)
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const current     = words[currentIndex]
  const maskedChars = current ? maskWordChars(current.word) : []
  const multiplier  = streakMultiplier(streak + 1)
  const timerPct    = (timeLeft / TIMER_SECONDS) * 100
  const timerColor  = timeLeft > 8 ? 'var(--green)' : timeLeft > 4 ? 'var(--gold)' : 'var(--red)'

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadScreen}>
        <div className={styles.loadIcon}>🔤</div>
        <p className={styles.loadText}>Loading words…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.loadScreen}>
        <div className={styles.loadIcon}>😕</div>
        <p className={styles.loadText}>{error}</p>
        <button className="btn btn-gold btn-sm" onClick={() => router.push('/spelling')} style={{ marginTop: 16 }}>
          ← Back to Lobby
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue} style={{ color: 'var(--gold)' }}>{score}</span>
        </div>

        <div className={styles.progressBox}>
          <span className={styles.progressText}>{currentIndex + 1} / {words.length}</span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.statBox} style={{ alignItems: 'flex-end' }}>
          <span className={styles.statLabel}>Streak</span>
          <span className={styles.statValue} style={{ color: streak > 0 ? 'var(--green)' : 'var(--text3)' }}>
            {streak > 0 ? `${streak}🔥` : '0'}
          </span>
        </div>
      </div>

      {/* ── Timer bar ── */}
      <div className={styles.timerRow}>
        <div className={styles.timerTrack}>
          <div
            className={styles.timerFill}
            style={{ width: `${timerPct}%`, background: timerColor, transition: 'width 0.5s linear, background 0.3s' }}
          />
        </div>
        <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}</span>
      </div>

      {/* ── Main content ── */}
      <div className={styles.main}>

        {/* Multiplier badge */}
        {streak >= 1 && (
          <div className={styles.multiplierBadge}>
            🔥 {multiplier}× Multiplier
          </div>
        )}

        {/* Masked word */}
        <div className={styles.maskedWord} key={currentIndex}>
          {maskedChars.map((char, i) => (
            <div key={i} className={styles.letterSlot}>
              <span className={styles.letterChar} style={{ color: char === '_' ? 'var(--text3)' : 'var(--gold)' }}>
                {char === '_' ? '?' : char}
              </span>
              <div className={styles.letterUnderline} style={{ background: char === '_' ? 'var(--border)' : 'var(--gold)' }} />
            </div>
          ))}
        </div>

        {/* Hear Word button */}
        <button
          onClick={handleHearWord}
          className={`${styles.hearBtn} ${speaking ? styles.hearBtnActive : ''}`}
        >
          <span>{speaking ? '🔊' : '🔈'}</span>
          {speaking ? 'Listening…' : 'Hear Word'}
        </button>

        {/* Hint */}
        {current?.hint && (
          <p className={styles.hint}>💡 {current.hint}</p>
        )}

        {/* Answer form */}
        <form onSubmit={handleSubmit} className={styles.answerForm}>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type the full word…"
            disabled={feedback !== 'idle'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={styles.answerInput}
          />
          <button
            type="submit"
            disabled={feedback !== 'idle' || !answer.trim()}
            className="btn btn-gold btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            SUBMIT ✓
          </button>
        </form>
      </div>

      {/* ── Feedback overlay ── */}
      {feedback !== 'idle' && (
        <div
          className={`${styles.overlay} ${
            feedback === 'correct' ? styles.overlayCorrect
            : feedback === 'wrong' ? styles.overlayWrong
            : styles.overlayTimeout
          }`}
        >
          {feedback === 'correct' && (
            <div className={styles.overlayContent}>
              <div className={styles.overlayIcon}>✅</div>
              <p className={styles.overlayTitle} style={{ color: 'var(--green)' }}>CORRECT!</p>
              <p className={styles.overlayPts}>+{calcPoints(streak)} pts</p>
            </div>
          )}

          {feedback === 'wrong' && (
            <div className={`${styles.overlayContent} ${styles.shake}`}>
              <div className={styles.overlayIcon}>❌</div>
              <p className={styles.overlayTitle} style={{ color: 'var(--red)' }}>WRONG!</p>
              <p className={styles.overlayWord}>
                The word was <strong style={{ color: 'var(--gold)' }}>{current?.word.toUpperCase()}</strong>
              </p>
            </div>
          )}

          {feedback === 'timeout' && (
            <div className={styles.overlayContent}>
              <div className={styles.overlayIcon}>⏰</div>
              <p className={styles.overlayTitle} style={{ color: 'var(--gold)' }}>TIME&apos;S UP!</p>
              <p className={styles.overlayWord}>
                The word was <strong style={{ color: 'var(--gold)' }}>{current?.word.toUpperCase()}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
