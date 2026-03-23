'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  getQuestions, addQuestion, deleteQuestion,
  SECTIONS, CATEGORIES, CATEGORY_ICONS, Question, Section, Category
} from '@/lib/questions'
import {
  getPracticeQuestions, addPracticeQuestion, deletePracticeQuestion,
  PracticeQuestion
} from '@/lib/practice'
import { useToast } from '@/context/ToastContext'
import styles from './page.module.css'

const ADMIN_PASSWORD = 'sow2025'
type AdminTab = 'quiz' | 'practice'

export default function AdminPage() {
  const { showToast } = useToast()

  // ── Auth ──
  const [authed,   setAuthed]  = useState(false)
  const [pwInput,  setPwInput] = useState('')
  const [pwError,  setPwError] = useState(false)
  const [showPw,   setShowPw]  = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('sow-admin') === 'true') setAuthed(true)
  }, [])

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('sow-admin', 'true')
      setAuthed(true); setPwError(false)
    } else {
      setPwError(true); setPwInput('')
    }
  }
  const handleLogout = () => {
    sessionStorage.removeItem('sow-admin')
    setAuthed(false); setPwInput('')
  }

  // ── Shared filters ──
  const [tab,      setTab]      = useState<AdminTab>('quiz')
  const [section,  setSection]  = useState<Section>(SECTIONS[0])
  const [category, setCategory] = useState<Category>(CATEGORIES[0])

  // ── Quiz questions state ──
  const [quizQs,    setQuizQs]   = useState<Question[]>([])
  const [quizLoad,  setQuizLoad] = useState(false)
  const [qNewQ,     setQNewQ]    = useState('')
  const [qNewA,     setQNewA]    = useState('')
  const [qSaving,   setQSaving]  = useState(false)

  // ── Practice questions state ──
  const [practiceQs,   setPracticeQs]  = useState<PracticeQuestion[]>([])
  const [practiceLoad, setPracticeLoad] = useState(false)
  const [pNewQ,        setPNewQ]       = useState('')
  const [pNewA,        setPNewA]       = useState('')
  const [pNewHint,     setPNewHint]    = useState('')
  const [pSaving,      setPSaving]     = useState(false)

  // ── Load quiz questions ──
  const loadQuiz = useCallback(async () => {
    if (!authed) return
    setQuizLoad(true)
    try { setQuizQs(await getQuestions(section, category)) }
    catch { showToast('Error loading quiz questions', 'error') }
    finally { setQuizLoad(false) }
  }, [section, category, authed])

  // ── Load practice questions ──
  const loadPractice = useCallback(async () => {
    if (!authed) return
    setPracticeLoad(true)
    try { setPracticeQs(await getPracticeQuestions(section, category)) }
    catch { showToast('Error loading practice questions', 'error') }
    finally { setPracticeLoad(false) }
  }, [section, category, authed])

  useEffect(() => {
    if (tab === 'quiz') loadQuiz()
    else loadPractice()
  }, [tab, section, category, authed])

  // ── Quiz handlers ──
  const handleAddQuiz = async () => {
    if (!qNewQ.trim() || !qNewA.trim()) { showToast('Fill both fields', 'error'); return }
    setQSaving(true)
    try {
      await addQuestion({ section, category, question: qNewQ.trim(), answer: qNewA.trim() })
      showToast('Question added!', 'success')
      setQNewQ(''); setQNewA(''); loadQuiz()
    } catch { showToast('Error saving', 'error') }
    finally { setQSaving(false) }
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); showToast('Deleted', 'success'); loadQuiz() }
    catch { showToast('Error', 'error') }
  }

  // ── Practice handlers ──
  const handleAddPractice = async () => {
    if (!pNewQ.trim() || !pNewA.trim()) { showToast('Fill question and answer', 'error'); return }
    setPSaving(true)
    try {
      await addPracticeQuestion({ section, category, question: pNewQ.trim(), answer: pNewA.trim(), hint: pNewHint.trim() })
      showToast('Practice question added!', 'success')
      setPNewQ(''); setPNewA(''); setPNewHint(''); loadPractice()
    } catch { showToast('Error saving', 'error') }
    finally { setPSaving(false) }
  }

  const handleDeletePractice = async (id: string) => {
    if (!confirm('Delete this practice question?')) return
    try { await deletePracticeQuestion(id); showToast('Deleted', 'success'); loadPractice() }
    catch { showToast('Error', 'error') }
  }

  // ══════════════════════════════════
  // PASSWORD GATE
  // ══════════════════════════════════
  if (!authed) return (
    <div className={styles.lockScreen}>
      <div className={styles.lockCard}>
        <div className={styles.lockIcon}>🔒</div>
        <h1 className={styles.lockTitle}>Admin Access</h1>
        <p className={styles.lockSub}>Enter the admin password to manage questions</p>
        <div className={styles.pwWrap}>
          <input
            type={showPw ? 'text' : 'password'}
            className={`${styles.pwInput} ${pwError ? styles.pwError : ''}`}
            placeholder="Password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          <button className={styles.eyeBtn} onClick={() => setShowPw(p => !p)} type="button">
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
        {pwError && <p className={styles.errorMsg}>❌ Incorrect password. Try again.</p>}
        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center' }}>
          Unlock Admin
        </button>
      </div>
    </div>
  )

  // ══════════════════════════════════
  // ADMIN PANEL
  // ══════════════════════════════════
  return (
    <div className="page" style={{ maxWidth: 920 }}>
      {/* Header */}
      <div className={styles.topBar}>
        <h1 className={styles.title}>⚙ Admin Panel</h1>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>🔒 Lock</button>
      </div>

      {/* Tab switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'quiz' ? styles.tabActive : ''}`}
          onClick={() => setTab('quiz')}>
          🎮 Quiz Questions
          <span className={styles.tabCount}>{quizQs.length}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'practice' ? styles.tabActive : ''}`}
          onClick={() => setTab('practice')}>
          📚 Practice Questions
          <span className={styles.tabCount}>{practiceQs.length}</span>
        </button>
      </div>

      {/* Filters — shared between both tabs */}
      <div className="form-row" style={{ maxWidth: 540, marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Section</label>
          <select value={section} onChange={e => setSection(e.target.value as Section)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as Category)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        {tab === 'quiz' ? '🎮 Quiz' : '📚 Practice'} —&nbsp;
        <strong>{CATEGORY_ICONS[category]} {category}</strong> ·&nbsp;
        <strong>{section}</strong> ·&nbsp;
        <strong>{tab === 'quiz' ? quizQs.length : practiceQs.length}</strong> questions
      </div>

      {/* ══ QUIZ TAB ══ */}
      {tab === 'quiz' && (
        <>
          <div className={styles.list}>
            {quizLoad
              ? <p className={styles.listEmpty}>Loading…</p>
              : quizQs.length === 0
                ? <p className={styles.listEmpty}>No quiz questions yet for this selection.</p>
                : quizQs.map((q, i) => (
                  <div key={q.id} className={styles.item}>
                    <div className={styles.qInfo}>
                      <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                      <span className={styles.qAns}>✓ {q.answer}</span>
                    </div>
                    <button className={styles.delBtn} onClick={() => handleDeleteQuiz(q.id)}>Delete</button>
                  </div>
                ))
            }
          </div>

          <div className={styles.addForm}>
            <h3 className={styles.addTitle}>➕ Add Quiz Question</h3>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Question / Word</label>
                <textarea value={qNewQ} onChange={e => setQNewQ(e.target.value)} placeholder="Enter question here…" rows={3} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Answer</label>
                <textarea value={qNewA} onChange={e => setQNewA(e.target.value)} placeholder="Correct answer…" rows={3} />
              </div>
            </div>
            <button className="btn btn-green btn-sm" onClick={handleAddQuiz} disabled={qSaving}>
              {qSaving ? 'Saving…' : '+ Add Question'}
            </button>
          </div>
        </>
      )}

      {/* ══ PRACTICE TAB ══ */}
      {tab === 'practice' && (
        <>
          <div className={styles.practiceNote}>
            💡 Practice questions are for students studying at home. They are separate from quiz questions and include an optional hint.
          </div>

          <div className={styles.list}>
            {practiceLoad
              ? <p className={styles.listEmpty}>Loading…</p>
              : practiceQs.length === 0
                ? <p className={styles.listEmpty}>No practice questions yet for this selection.</p>
                : practiceQs.map((q, i) => (
                  <div key={q.id} className={styles.item}>
                    <div className={styles.qInfo}>
                      <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                      <span className={styles.qAns}>✓ {q.answer}</span>
                      {q.hint && <span className={styles.qHint}>💡 {q.hint}</span>}
                    </div>
                    <button className={styles.delBtn} onClick={() => handleDeletePractice(q.id)}>Delete</button>
                  </div>
                ))
            }
          </div>

          <div className={styles.addForm}>
            <h3 className={styles.addTitle}>➕ Add Practice Question</h3>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Question / Word</label>
                <textarea value={pNewQ} onChange={e => setPNewQ(e.target.value)} placeholder="Enter question here…" rows={3} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Answer</label>
                <textarea value={pNewA} onChange={e => setPNewA(e.target.value)} placeholder="Correct answer…" rows={3} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Hint <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(optional)</span></label>
              <input
                type="text"
                value={pNewHint}
                onChange={e => setPNewHint(e.target.value)}
                placeholder="e.g. Think about the water cycle…"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddPractice} disabled={pSaving}>
              {pSaving ? 'Saving…' : '+ Add Practice Question'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
