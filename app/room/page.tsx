'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRoom, updateRoom, deleteRoom, getContestants,
  awardContestant, lockContestant,
  subscribeToRoom, subscribeToContestants,
  Room, Contestant, QuestionPayload
} from '../../lib/rooms'
import { getAllForSection, CATEGORIES, CATEGORY_ICONS, Question, Category, Section, SECTIONS } from '../../lib/questions'
import { upsertScore } from '../../lib/scores'
import { useToast } from '../../context/ToastContext'
import { useSound } from '../../hooks/useSound'
import styles from './page.module.css'

const ALL_CATS = ['Maths', 'Spelling Bee', 'General Knowledge']

function getHostId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('sow-host-id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('sow-host-id', id) }
  return id
}

export default function RoomPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { play } = useSound()

  // Setup
  const [step,        setStep]       = useState<'setup' | 'lobby' | 'game' | 'end'>('setup')
  const [section,     setSection]    = useState<Section>(SECTIONS[0])
  const [ptsPerQ,     setPtsPerQ]    = useState(10)
  const [timerSecs,   setTimerSecs]  = useState(30)
  const [selCats,     setSelCats]    = useState<string[]>([...ALL_CATS])
  const [creating,    setCreating]   = useState(false)
  const [soundOn,     setSoundOn]    = useState(true)

  // Room
  const [room,        setRoom]        = useState<Room | null>(null)
  const [contestants, setContestants] = useState<Contestant[]>([])

  // Game
  const [grouped,    setGrouped]    = useState<Record<string, Question[]>>({})
  const [activeQ,    setActiveQ]    = useState<Question | null>(null)
  const [usedIds,    setUsedIds]    = useState<Set<string>>(new Set())
  const [revealed,   setRevealed]   = useState(false)
  const [loadingQs,  setLoadingQs]  = useState(false)
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null)
  const [doubleOn,   setDoubleOn]   = useState(false)
  const [usedLifelines, setUsedLifelines] = useState<Record<string, string[]>>({}) // contestantId -> ['skip','fifty']

  const subRef   = useRef<any>(null)
  const subCRef  = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load questions
  useEffect(() => {
    if (step !== 'game' || !room) return
    setLoadingQs(true)
    getAllForSection(section).then(g => { setGrouped(g); setLoadingQs(false) })
  }, [section, step])

  // Realtime subscriptions
  useEffect(() => {
    if (!room) return
    subRef.current  = subscribeToRoom(room.code, r => {
      setRoom(r)
      if (r.buzzed_by && r.status === 'buzzed') { play('buzz'); showToast(`🔔 ${r.buzzed_by} buzzed!`, 'info') }
    })
    subCRef.current = subscribeToContestants(room.code, setContestants)
    return () => { subRef.current?.unsubscribe(); subCRef.current?.unsubscribe() }
  }, [room?.code])

  // Sync timer from room
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!room?.timer_started_at || room.status !== 'question') { setTimeLeft(null); return }
    const tick = () => {
      const elapsed = (Date.now() - new Date(room.timer_started_at!).getTime()) / 1000
      const left = Math.max(0, room.timer_seconds - elapsed)
      setTimeLeft(Math.ceil(left))
      if (left <= 0) {
        clearInterval(timerRef.current!); setTimeLeft(0)
        play('timeup')
      } else if (left <= 5) {
        play('tick')
      }
    }
    tick()
    timerRef.current = setInterval(tick, 250)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [room?.timer_started_at, room?.status])

  const toggleCat = (cat: string) =>
    setSelCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])

  const handleCreate = async () => {
    if (selCats.length === 0) { showToast('Select at least one category', 'error'); return }
    setCreating(true)
    try {
      const r = await createRoom(getHostId(), { section, ptsPerQ, timerSeconds: timerSecs, categories: selCats })
      setRoom(r)
      setStep('lobby')
      setContestants(await getContestants(r.code))
      showToast(`Room ${r.code} created!`, 'success')
    } catch { showToast('Failed to create room', 'error') }
    finally { setCreating(false) }
  }

  const handleStart = async () => {
    if (!room) return
    await updateRoom(room.code, { status: 'waiting' })
    setStep('game')
    showToast('Game started! Pick a question.', 'success')
  }

  const pushQuestion = async (q: Question) => {
    if (!room) return
    setActiveQ(q); setRevealed(false); setDoubleOn(room.double_points)
    setUsedIds(prev => new Set([...prev, q.id]))
    const payload: QuestionPayload = { id: q.id, question: q.question, answer: q.answer, category: q.category }
    await updateRoom(room.code, {
      status: 'question',
      current_q: payload,
      buzzed_by: null,
      timer_started_at: new Date().toISOString(),
    })
  }

  const handleReveal = async () => {
    if (!room) return
    setRevealed(true)
    await updateRoom(room.code, { status: 'revealed' })
  }

  const effectivePts = (base: number) => doubleOn ? base * 2 : base

  const handleAward = async (correct: boolean) => {
    if (!room?.buzzed_by || !activeQ) return
    const c = contestants.find(c => c.name === room.buzzed_by)
    if (c) {
      if (correct) {
        const pts = effectivePts(room.pts_per_q)
        await awardContestant(c.id, pts)
        play('correct')
        showToast(`✅ +${pts}${doubleOn ? ' (2✕!)' : ''} → ${c.name}!`, 'success')
      } else {
        // Lock this contestant out for this question
        await lockContestant(c.id, activeQ.id)
        play('wrong')
        showToast(`❌ Wrong — ${c.name} locked out`, 'error')
        // Reset buzz so another contestant can buzz
        await updateRoom(room.code, { status: 'question', buzzed_by: null })
        return
      }
    }
    await updateRoom(room.code, { status: 'revealed', buzzed_by: null, double_points: false })
    setDoubleOn(false)
  }

  const toggleDouble = async () => {
    if (!room) return
    const next = !room.double_points
    await updateRoom(room.code, { double_points: next })
    if (next) { play('double'); showToast('🔥 Double Points ON!', 'success') }
    else showToast('Double Points off', 'info')
  }

  const handleEnd = async () => {
    if (!room || !confirm('End the game?')) return
    await updateRoom(room.code, { status: 'ended' })
    // Save top scorer to leaderboard
    const sorted = [...contestants].sort((a, b) => b.score - a.score)
    if (sorted[0]) {
      await upsertScore({ teamName: sorted[0].name, section, addScore: sorted[0].score, addWin: true })
    }
    play('fanfare')
    setStep('end')
  }

  const timerPct  = timeLeft !== null && room ? (timeLeft / room.timer_seconds) * 100 : 100
  const timerColor = !timeLeft ? '#555' : timerPct > 60 ? 'var(--green)' : timerPct > 28 ? 'var(--gold)' : 'var(--danger)'
  const sorted = [...contestants].sort((a, b) => b.score - a.score)

  // ══ SETUP ══
  if (step === 'setup') return (
    <div className={styles.centered}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>🎮 Create a Room</h1>
        <p className={styles.sub}>Contestants join with your room code on their phones</p>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Grade Section</label>
          <select value={section} onChange={e => setSection(e.target.value as Section)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Points / Question</label>
            <input type="number" min={1} max={100} value={ptsPerQ} onChange={e => setPtsPerQ(Number(e.target.value))} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Timer (seconds)</label>
            <input type="number" min={10} max={120} value={timerSecs} onChange={e => setTimerSecs(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Categories to include</label>
          <div className={styles.catPicker}>
            {ALL_CATS.map(c => (
              <button key={c} type="button"
                className={`${styles.catChip} ${selCats.includes(c) ? styles.catActive : ''}`}
                onClick={() => toggleCat(c)}>
                {CATEGORY_ICONS[c as Category]} {c}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleCreate} disabled={creating}
          style={{ width: '100%', justifyContent: 'center' }}>
          {creating ? 'Creating…' : '🚀 Create Room'}
        </button>
      </div>
    </div>
  )

  // ══ LOBBY ══
  if (step === 'lobby' && room) return (
    <div className={styles.centered}>
      <div className={styles.lobbyCard}>
        <p className={styles.lobbyHint}>Share this code with contestants:</p>
        <div className={styles.codeBox}>{room.code}</div>
        <p className={styles.joinUrl}>
          → <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/join</strong>
        </p>
        <p className={styles.audienceUrl}>
          📺 Projector: <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/audience?code={room.code}</strong>
        </p>
        <div className={styles.contestantList}>
          <p className={styles.waitLabel}>
            {contestants.length === 0 ? 'Waiting for contestants…'
              : `${contestants.length} joined:`}
          </p>
          {contestants.map(c => (
            <div key={c.id} className={styles.contestantChip}
              style={{ borderColor: c.team_color, color: c.team_color }}>{c.name}</div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleStart}
          disabled={contestants.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
          ▶ Start Game ({contestants.length} players)
        </button>
      </div>
    </div>
  )

  // ══ GAME ══
  if (step === 'game' && room) return (
    <div className="page" style={{ maxWidth: 1020 }}>
      {/* Top bar */}
      <div className={styles.gameTop}>
        <div>
          <h1 className={styles.gameTitle}>Room: <span className={styles.code}>{room.code}</span></h1>
          <p className={styles.gameSub}>{section} · {contestants.length} players · {room.pts_per_q} pts/Q</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${soundOn ? 'btn-ghost' : 'btn-ghost'}`}
            onClick={() => setSoundOn(s => !s)} title="Toggle sound">
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className={`btn btn-sm ${room.double_points ? 'btn-warning' : 'btn-ghost'}`}
            onClick={toggleDouble} title="Toggle double points">
            {room.double_points ? '🔥 2✕ ON' : '2✕ Double'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleEnd}>End Game</button>
        </div>
      </div>

      {/* Scores */}
      <div className={styles.scores}>
        {sorted.map((c, i) => (
          <div key={c.id} className={styles.scoreBadge} style={{ borderColor: c.team_color }}>
            {i === 0 && sorted.length > 1 && <span className={styles.crown}>👑</span>}
            <div className={styles.scoreName} style={{ color: c.team_color }}>{c.name}</div>
            <div className={styles.scoreVal}  style={{ color: c.team_color }}>{c.score}</div>
          </div>
        ))}
      </div>

      {/* Active question panel */}
      {activeQ && (
        <div className={styles.activeQ}>
          <div className={styles.qTopRow}>
            <div className={styles.qCat}>{CATEGORY_ICONS[activeQ.category as Category]} {activeQ.category}</div>
            {room.double_points && <span className={styles.doubleBadge}>🔥 2✕ DOUBLE POINTS</span>}
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <div className={styles.timerWrap}>
              <div className={styles.timerBarOuter}>
                <div className={styles.timerBarInner}
                  style={{ width: `${timerPct}%`, background: timerColor }} />
              </div>
              <span className={styles.timerNum} style={{ color: timerColor }}>{timeLeft}s</span>
            </div>
          )}

          <p className={styles.qText}>{activeQ.question}</p>

          {revealed
            ? <div className={styles.answerBox}>Answer: <strong>{activeQ.answer}</strong></div>
            : <button className="btn btn-ghost btn-sm" onClick={handleReveal}>👁 Reveal Answer</button>
          }
        </div>
      )}

      {/* Buzz indicator */}
      {room.buzzed_by && (
        <div className={styles.buzzAlert}>
          <span className={styles.buzzName}>🔔 {room.buzzed_by} buzzed first!</span>
          <div className={styles.buzzActions}>
            <button className="btn btn-green btn-sm" onClick={() => handleAward(true)}>
              ✓ Correct {room.double_points ? `(+${effectivePts(room.pts_per_q)})` : ''}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleAward(false)}>
              ✗ Wrong (lock out)
            </button>
          </div>
        </div>
      )}

      {/* Question grid */}
      {loadingQs ? <p style={{ color: 'var(--text2)' }}>Loading questions…</p>
        : (room.categories || ALL_CATS).filter(cat => (grouped[cat] || []).length > 0).map(cat => (
          <div key={cat} className={styles.catSection}>
            <h3 className={styles.catTitle}>
              {CATEGORY_ICONS[cat as Category]} {cat}
              <span className={styles.catCount}>{(grouped[cat] || []).length} Qs</span>
            </h3>
            <div className={styles.qGrid}>
              {(grouped[cat] || []).map((q, i) => (
                <button key={q.id}
                  className={`${styles.qBtn} ${usedIds.has(q.id) ? styles.qActive : ''}`}
                  onClick={() => pushQuestion(q)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )

  // ══ END SCREEN ══
  if (step === 'end') return (
    <div className={styles.centered}>
      <div className={styles.endCard}>
        <div className={styles.endIcon}>🏆</div>
        <h1 className={styles.endTitle}>Game Over!</h1>
        {sorted[0] && (
          <p className={styles.endWinner} style={{ color: sorted[0].team_color }}>
            👑 {sorted[0].name} wins!
          </p>
        )}
        <div className={styles.finalScores}>
          {sorted.map((c, i) => (
            <div key={c.id} className={styles.finalRow} style={{ borderColor: c.team_color }}>
              <span className={styles.finalRank}>{['🥇','🥈','🥉'][i] ?? `${i+1}`}</span>
              <span className={styles.finalName} style={{ color: c.team_color }}>{c.name}</span>
              <span className={styles.finalScore} style={{ color: c.team_color }}>{c.score} pts</span>
            </div>
          ))}
        </div>
        <div className={styles.endBtns}>
          {sorted[0] && (
            <button className="btn btn-primary" onClick={() => {
              const w = sorted[0]
              const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              router.push(`/certificate?winner=${encodeURIComponent(w.name)}&score=${w.score}&section=${encodeURIComponent(section)}&category=Quiz Championship&date=${encodeURIComponent(date)}`)
            }}>🏅 Print Certificate</button>
          )}
          <button className="btn btn-ghost" onClick={() => router.push('/leaderboard')}>📊 Leaderboard</button>
          <button className="btn btn-ghost" onClick={() => router.push('/room')}>🔄 New Room</button>
        </div>
      </div>
    </div>
  )

  return null
}