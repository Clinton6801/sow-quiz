'use client'

/**
 * /spelling — Spelling Game lobby.
 * Player enters their name, selects their section, then starts the game.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SECTIONS } from '@/lib/questions'
import styles from './page.module.css'

export default function SpellingLobbyPage() {
  const router = useRouter()
  const [name,    setName]    = useState('')
  const [section, setSection] = useState('')
  const [error,   setError]   = useState('')

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setError('Please enter your name.'); return }
    if (!section)      { setError('Please select a section.'); return }
    setError('')

    sessionStorage.setItem('spelling_player',  name.trim())
    sessionStorage.setItem('spelling_section', section)

    router.push('/spelling/play')
  }

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link href="/" className="btn btn-ghost btn-sm">← Home</Link>
        <Link href="/spelling/leaderboard" className="btn btn-ghost btn-sm">🏆 Leaderboard</Link>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>🔤</div>
        <h1 className={styles.title}>SPELLING BEE</h1>
        <p className={styles.subtitle}>SOW Quiz Championship</p>
        <p className={styles.tagline}>Hear the word · Spell it right · Beat the clock</p>
      </div>

      {/* Form */}
      <form onSubmit={handleStart} className={styles.form}>
        <div className={styles.field}>
          <label className="form-label">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name…"
            maxLength={40}
            autoComplete="off"
          />
        </div>

        <div className={styles.field}>
          <label className="form-label">Select Section</label>
          <div className={styles.sectionGrid}>
            {SECTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={`${styles.sectionBtn} ${section === s ? styles.sectionActive : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          🚀 START GAME
        </button>
      </form>
    </div>
  )
}
