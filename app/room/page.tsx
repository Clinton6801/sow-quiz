'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRoom, updateRoom, deleteRoom, getContestants, awardContestant,
  subscribeToRoom, subscribeToContestants,
  Room, Contestant, QuestionPayload
} from '@/lib/rooms'
import { getAllForSection, CATEGORIES, CATEGORY_ICONS, Question } from '@/lib/questions'
import { SECTIONS } from '@/lib/questions'
import { useToast } from '@/context/ToastContext'
import styles from './page.module.css'

// ── Persistent host ID (so only the creator can control the room) ──
function getHostId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('sow-host-id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('sow-host-id', id) }
  return id
}

export default function RoomPage() {
  const router = useRouter()
  const { showToast } = useToast()

  // Setup state
  const [step,     setStep]     = useState<'setup' | 'lobby' | 'game'>('setup')
  const [section,  setSection]  = useState(SECTIONS[0])
  const [ptsPerQ,  setPtsPerQ]  = useState(10)
  const [creating, setCreating] = useState(false)

  // Room state
  const [room,        setRoom]        = useState<Room | null>(null)
  const [contestants, setContestants] = useState<Contestant[]>([])

  // Questions
  const [grouped, setGrouped]       = useState<Record<string, Question[]>>({})
  const [activeQ,  setActiveQ]       = useState<Question | null>(null)
  const [revealed, setRevealed]      = useState(false)
  const [loadingQs, setLoadingQs]   = useState(false)

  const subRef = useRef<any>(null)
  const subCRef = useRef<any>(null)

  // Load questions when section changes
  useEffect(() => {
    if (step !== 'game') return
    setLoadingQs(true)
    getAllForSection(section as any).then(g => { setGrouped(g); setLoadingQs(false) })
  }, [section, step])

  // Subscribe to realtime when room exists
  useEffect(() => {
    if (!room) return
    subRef.current  = subscribeToRoom(room.code, r => setRoom(r))
    subCRef.current = subscribeToContestants(room.code, c => setContestants(c))
    return () => {
      subRef.current?.unsubscribe()
      subCRef.current?.unsubscribe()
    }
  }, [room?.code])

  // Create room
  const handleCreate = async () => {
    setCreating(true)
    try {
      const hostId = getHostId()
      const r = await createRoom(hostId, section)
      setRoom(r)
      setStep('lobby')
      showToast(`Room ${r.code} created!`, 'success')
      // Load initial contestants
      setContestants(await getContestants(r.code))
    } catch {
      showToast('Failed to create room', 'error')
    } finally {
      setCreating(false)
    }
  }

  // Start game
  const handleStart = async () => {
    if (!room) return
    await updateRoom(room.code, { status: 'waiting' })
    setStep('game')
    showToast('Game started!', 'success')
  }

  // Push question to all contestants
  const pushQuestion = async (q: Question) => {
    if (!room) return
    setActiveQ(q)
    setRevealed(false)
    const payload: QuestionPayload = {
      id: q.id, question: q.question, answer: q.answer, category: q.category
    }
    await updateRoom(room.code, { status: 'question', current_q: payload, buzzed_by: null })
  }

  // Reveal answer (contestants see question text)
  const handleReveal = async () => {
    if (!room) return
    setRevealed(true)
    await updateRoom(room.code, { status: 'revealed' })
  }

  // Award points to buzzed contestant
  const handleAward = async (correct: boolean) => {
    if (!room?.buzzed_by) return
    const c = contestants.find(c => c.name === room.buzzed_by)
    if (c && correct) {
      await awardContestant(c.id, ptsPerQ)
      showToast(`✅ +${ptsPerQ} → ${c.name}!`, 'success')
    } else {
      showToast(`❌ Wrong — no points`, 'error')
    }
    await updateRoom(room.code, { status: 'revealed', buzzed_by: null })
  }

  // End & close room
  const handleEnd = async () => {
    if (!room || !confirm('End the game and close this room?')) return
    await deleteRoom(room.code)
    showToast('Room closed', 'info')
    router.push('/leaderboard')
  }

  // ═══════════════ STEP: SETUP ═══════════════
  if (step === 'setup') return (
    <div className={styles.centered}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>🎮 Create a Room</h1>
        <p className={styles.sub}>Contestants will join with your room code on their phones</p>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Grade Section</label>
          <select value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Points per Question</label>
          <input type="number" min={1} max={100} value={ptsPerQ}
            onChange={e => setPtsPerQ(Number(e.target.value))} />
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleCreate} disabled={creating}
          style={{ width: '100%', justifyContent: 'center' }}>
          {creating ? 'Creating…' : '🚀 Create Room'}
        </button>
      </div>
    </div>
  )

  // ═══════════════ STEP: LOBBY ═══════════════
  if (step === 'lobby' && room) return (
    <div className={styles.centered}>
      <div className={styles.lobbyCard}>
        <p className={styles.lobbyHint}>Share this code with contestants:</p>
        <div className={styles.codeBox}>{room.code}</div>
        <p className={styles.joinUrl}>
          They go to: <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/join</strong>
        </p>

        <div className={styles.contestantList}>
          <p className={styles.waitLabel}>
            {contestants.length === 0
              ? 'Waiting for contestants to join…'
              : `${contestants.length} contestant${contestants.length !== 1 ? 's' : ''} joined:`
            }
          </p>
          {contestants.map(c => (
            <div key={c.id} className={styles.contestantChip}
              style={{ borderColor: c.team_color, color: c.team_color }}>
              {c.name}
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          disabled={contestants.length === 0}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          ▶ Start Game ({contestants.length} players)
        </button>
      </div>
    </div>
  )

  // ═══════════════ STEP: GAME ═══════════════
  if (step === 'game' && room) return (
    <div className="page" style={{ maxWidth: 1000 }}>
      {/* Top bar */}
      <div className={styles.gameTop}>
        <div>
          <h1 className={styles.gameTitle}>🎮 Room: <span className={styles.code}>{room.code}</span></h1>
          <p className={styles.gameSub}>{section} · {contestants.length} players · {ptsPerQ} pts/Q</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleEnd}>End Game</button>
      </div>

      {/* Scores */}
      <div className={styles.scores}>
        {[...contestants].sort((a, b) => b.score - a.score).map((c, i) => (
          <div key={c.id} className={styles.scoreBadge} style={{ borderColor: c.team_color }}>
            {i === 0 && contestants.length > 1 && <span className={styles.crown}>👑</span>}
            <div className={styles.scoreName} style={{ color: c.team_color }}>{c.name}</div>
            <div className={styles.scoreVal}  style={{ color: c.team_color }}>{c.score}</div>
          </div>
        ))}
      </div>

      {/* Buzz indicator */}
      {room.buzzed_by && (
        <div className={styles.buzzAlert}>
          <span className={styles.buzzName}>🔔 {room.buzzed_by} buzzed first!</span>
          <div className={styles.buzzActions}>
            <button className="btn btn-green btn-sm" onClick={() => handleAward(true)}>✓ Correct</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleAward(false)}>✗ Wrong</button>
          </div>
        </div>
      )}

      {/* Active question */}
      {activeQ && (
        <div className={styles.activeQ}>
          <div className={styles.qCat}>{CATEGORY_ICONS[activeQ.category as any]} {activeQ.category}</div>
          <p className={styles.qText}>{activeQ.question}</p>
          {revealed
            ? <div className={styles.answerBox}>Answer: <strong>{activeQ.answer}</strong></div>
            : <button className="btn btn-ghost btn-sm" onClick={handleReveal}>👁 Reveal Answer</button>
          }
        </div>
      )}

      {/* Question grid by category */}
      {loadingQs
        ? <p style={{ color: 'var(--text2)' }}>Loading questions…</p>
        : CATEGORIES.map(cat => {
          const qs = grouped[cat] || []
          return (
            <div key={cat} className={styles.catSection}>
              <h3 className={styles.catTitle}>{CATEGORY_ICONS[cat]} {cat}
                <span className={styles.catCount}>{qs.length} Qs</span>
              </h3>
              <div className={styles.qGrid}>
                {qs.map((q, i) => (
                  <button key={q.id} className={`${styles.qBtn} ${activeQ?.id === q.id ? styles.qActive : ''}`}
                    onClick={() => pushQuestion(q)}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )
        })
      }
    </div>
  )

  return null
}
