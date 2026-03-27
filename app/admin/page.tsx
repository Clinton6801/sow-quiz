'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getQuestions, addQuestion, deleteQuestion,
  SECTIONS, CATEGORIES, CATEGORY_ICONS, Question, Section, Category
} from '../../lib/questions'
import {
  getAllPracticeQuestions, addPracticeQuestion, deletePracticeQuestion,
  PracticeQuestion
} from '../../lib/practice'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import styles from './page.module.css'
import VoicePicker from '../../components/ui/VoicePicker'

const ADMIN_PASSWORD = 'sow2025'
type AdminTab = 'quiz' | 'practice' | 'settings'

// ── Edit question in place ──
async function updateQuestion(id: string, question: string, answer: string) {
  const { error } = await supabase.from('questions').update({ question, answer }).eq('id', id)
  if (error) throw error
}
async function updatePracticeQuestion(id: string, question: string, answer: string, hint: string) {
  const { error } = await supabase.from('practice_questions').update({ question, answer, hint }).eq('id', id)
  if (error) throw error
}

export default function AdminPage() {
  const { showToast } = useToast()

  // Auth
  const [authed,  setAuthed]  = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('sow-admin') === 'true') setAuthed(true)
  }, [])

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('sow-admin', 'true')
      setAuthed(true); setPwError(false)
    } else { setPwError(true); setPwInput('') }
  }
  const handleLogout = () => { sessionStorage.removeItem('sow-admin'); setAuthed(false) }

  // Filters
  const [tab,      setTab]      = useState<AdminTab>('quiz')
  const [section,  setSection]  = useState<Section>(SECTIONS[0])
  const [category, setCategory] = useState<Category>(CATEGORIES[0])

  // Quiz questions
  const [quizQs,   setQuizQs]   = useState<Question[]>([])
  const [quizLoad, setQuizLoad]  = useState(false)
  const [qNewQ,    setQNewQ]     = useState('')
  const [qNewA,    setQNewA]     = useState('')
  const [qSaving,  setQSaving]   = useState(false)
  const [editingQ, setEditingQ]  = useState<string | null>(null)
  const [editQVal, setEditQVal]  = useState({ q: '', a: '' })

  // Practice questions
  const [practiceQs,   setPracticeQs]   = useState<PracticeQuestion[]>([])
  const [practiceLoad, setPracticeLoad] = useState(false)
  const [pNewQ,        setPNewQ]        = useState('')
  const [pNewA,        setPNewA]        = useState('')
  const [pNewHint,     setPNewHint]     = useState('')
  const [pSaving,      setPSaving]      = useState(false)
  const [editingP,     setEditingP]     = useState<string | null>(null)
  const [editPVal,     setEditPVal]     = useState({ q: '', a: '', hint: '' })

  // CSV import
  const [csvTab,       setCsvTab]       = useState(false)
  const [csvText,      setCsvText]      = useState('')
  const [csvParsed,    setCsvParsed]    = useState<{q:string;a:string;hint?:string}[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadQuiz = useCallback(async () => {
    if (!authed) return
    setQuizLoad(true)
    try { setQuizQs(await getQuestions(section, category)) }
    catch { showToast('Error loading', 'error') }
    finally { setQuizLoad(false) }
  }, [section, category, authed])

  const loadPractice = useCallback(async () => {
    if (!authed) return
    setPracticeLoad(true)
    try { setPracticeQs(await getAllPracticeQuestions(section, category)) }
    catch { showToast('Error loading', 'error') }
    finally { setPracticeLoad(false) }
  }, [section, category, authed])

  useEffect(() => {
    if (tab === 'quiz') loadQuiz(); else loadPractice()
  }, [tab, section, category, authed])

  // Quiz CRUD
  const handleAddQuiz = async () => {
    if (!qNewQ.trim() || !qNewA.trim()) { showToast('Fill both fields', 'error'); return }
    setQSaving(true)
    try { await addQuestion({ section, category, question: qNewQ.trim(), answer: qNewA.trim() }); showToast('Added!', 'success'); setQNewQ(''); setQNewA(''); loadQuiz() }
    catch { showToast('Error', 'error') } finally { setQSaving(false) }
  }
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); showToast('Deleted', 'success'); loadQuiz() }
    catch { showToast('Error', 'error') }
  }
  const startEditQuiz = (q: Question) => { setEditingQ(q.id); setEditQVal({ q: q.question, a: q.answer }) }
  const saveEditQuiz = async (id: string) => {
    try { await updateQuestion(id, editQVal.q, editQVal.a); showToast('Updated!', 'success'); setEditingQ(null); loadQuiz() }
    catch { showToast('Error', 'error') }
  }

  // Practice CRUD
  const handleAddPractice = async () => {
    if (!pNewQ.trim() || !pNewA.trim()) { showToast('Fill question and answer', 'error'); return }
    setPSaving(true)
    try { await addPracticeQuestion({ section, category, question: pNewQ.trim(), answer: pNewA.trim(), hint: pNewHint.trim() }); showToast('Added!', 'success'); setPNewQ(''); setPNewA(''); setPNewHint(''); loadPractice() }
    catch { showToast('Error', 'error') } finally { setPSaving(false) }
  }
  const handleDeletePractice = async (id: string) => {
    if (!confirm('Delete this question?')) return
    try { await deletePracticeQuestion(id); showToast('Deleted', 'success'); loadPractice() }
    catch { showToast('Error', 'error') }
  }
  const startEditPractice = (q: PracticeQuestion) => { setEditingP(q.id); setEditPVal({ q: q.question, a: q.answer, hint: q.hint }) }
  const saveEditPractice = async (id: string) => {
    try { await updatePracticeQuestion(id, editPVal.q, editPVal.a, editPVal.hint); showToast('Updated!', 'success'); setEditingP(null); loadPractice() }
    catch { showToast('Error', 'error') }
  }

  // CSV parsing
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const rows = lines.map(line => {
      // Handle quoted fields
      const cols: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ }
        else if (line[i] === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
        else cur += line[i]
      }
      cols.push(cur.trim())
      return cols
    }).filter(r => r.length >= 2 && r[0] && r[1])
    setCsvParsed(rows.map(r => ({ q: r[0], a: r[1], hint: r[2] ?? '' })))
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { const text = ev.target?.result as string; setCsvText(text); parseCSV(text) }
    reader.readAsText(file)
  }

  const handleImportCSV = async () => {
    if (!csvParsed.length) return
    setCsvImporting(true)
    try {
      const table = tab === 'quiz' ? 'questions' : 'practice_questions'
      const rows = csvParsed.map(r => ({
        section, category,
        question: r.q, answer: r.a,
        ...(tab === 'practice' ? { hint: r.hint ?? '' } : {})
      }))
      const { error } = await supabase.from(table).insert(rows)
      if (error) throw error
      showToast(`✅ Imported ${rows.length} questions!`, 'success')
      setCsvText(''); setCsvParsed([]); setCsvTab(false)
      if (tab === 'quiz') loadQuiz(); else loadPractice()
    } catch { showToast('Import failed', 'error') }
    finally { setCsvImporting(false) }
  }

  // ── PASSWORD GATE ──
  if (!authed) return (
    <div className={styles.lockScreen}>
      <div className={styles.lockCard}>
        <div className={styles.lockIcon}>🔒</div>
        <h1 className={styles.lockTitle}>Admin Access</h1>
        <p className={styles.lockSub}>Enter the admin password to manage questions</p>
        <div className={styles.pwWrap}>
          <input type={showPw ? 'text' : 'password'} className={`${styles.pwInput} ${pwError ? styles.pwError : ''}`}
            placeholder="Password" value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
          <button className={styles.eyeBtn} onClick={() => setShowPw(p => !p)} type="button">{showPw ? '🙈' : '👁'}</button>
        </div>
        {pwError && <p className={styles.errorMsg}>❌ Incorrect password</p>}
        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center' }}>Unlock Admin</button>
      </div>
    </div>
  )

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>⚙ Admin Panel</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${csvTab ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCsvTab(t => !t)}>
            📥 CSV Import
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>🔒 Lock</button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'quiz' ? styles.tabActive : ''}`} onClick={() => setTab('quiz')}>
          🎮 Quiz Questions <span className={styles.tabCount}>{quizQs.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'practice' ? styles.tabActive : ''}`} onClick={() => setTab('practice')}>
          📚 Practice Questions <span className={styles.tabCount}>{practiceQs.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`} onClick={() => setTab('settings')}>
          ⚙ Settings
        </button>
      </div>

      {/* Filters */}
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
        {tab === 'quiz' ? '🎮 Quiz' : '📚 Practice'} — <strong>{CATEGORY_ICONS[category]} {category}</strong> · <strong>{section}</strong> · <strong>{tab === 'quiz' ? quizQs.length : practiceQs.length}</strong> questions
      </div>

      {/* CSV Import panel */}
      {csvTab && (
        <div className={styles.csvPanel}>
          <h3 className={styles.csvTitle}>📥 Bulk Import via CSV</h3>
          <p className={styles.csvHint}>
            Format: <code>question, answer{tab === 'practice' ? ', hint (optional)' : ''}</code><br />
            One question per line. No header row needed.
          </p>
          <div className={styles.csvActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>📂 Upload CSV File</button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSVFile} style={{ display: 'none' }} />
          </div>
          <textarea className={styles.csvTextarea} value={csvText}
            onChange={e => { setCsvText(e.target.value); parseCSV(e.target.value) }}
            placeholder={`What is 2 + 2, 4\nSpell "beautiful", beautiful\nWho is the president of Nigeria, Bola Tinubu`}
            rows={6} />
          {csvParsed.length > 0 && (
            <div className={styles.csvPreview}>
              <p className={styles.csvPreviewTitle}>✅ {csvParsed.length} questions ready to import into <strong>{section} / {category}</strong></p>
              <div className={styles.csvPreviewList}>
                {csvParsed.slice(0, 5).map((r, i) => (
                  <div key={i} className={styles.csvPreviewRow}>
                    <span className={styles.csvPreviewQ}>{i + 1}. {r.q}</span>
                    <span className={styles.csvPreviewA}>→ {r.a}</span>
                  </div>
                ))}
                {csvParsed.length > 5 && <p className={styles.csvMore}>...and {csvParsed.length - 5} more</p>}
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleImportCSV} disabled={csvImporting}>
                {csvImporting ? 'Importing…' : `⬆ Import ${csvParsed.length} Questions`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ TAB ── */}
      {tab === 'quiz' && (
        <>
          <div className={styles.list}>
            {quizLoad ? <p className={styles.listEmpty}>Loading…</p>
              : quizQs.length === 0 ? <p className={styles.listEmpty}>No questions yet.</p>
              : quizQs.map((q, i) => (
                <div key={q.id} className={styles.item}>
                  {editingQ === q.id ? (
                    <div className={styles.editForm}>
                      <textarea className={styles.editInput} value={editQVal.q} onChange={e => setEditQVal(v => ({ ...v, q: e.target.value }))} rows={2} />
                      <input className={styles.editInput} value={editQVal.a} onChange={e => setEditQVal(v => ({ ...v, a: e.target.value }))} placeholder="Answer" />
                      <div className={styles.editBtns}>
                        <button className="btn btn-green btn-sm" onClick={() => saveEditQuiz(q.id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingQ(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.qInfo}>
                        <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                        <span className={styles.qAns}>✓ {q.answer}</span>
                      </div>
                      <div className={styles.itemBtns}>
                        <button className={styles.editBtn} onClick={() => startEditQuiz(q)}>✏ Edit</button>
                        <button className={styles.delBtn} onClick={() => handleDeleteQuiz(q.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            }
          </div>
          <div className={styles.addForm}>
            <h3 className={styles.addTitle}>➕ Add Quiz Question</h3>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Question / Word</label>
                <textarea value={qNewQ} onChange={e => setQNewQ(e.target.value)} placeholder="Enter question…" rows={3} />
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

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 560 }}>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: 'var(--cyan)', marginBottom: 16 }}>
            🔊 Audio Settings
          </h3>
          <VoicePicker />
          <div className={styles.practiceNote} style={{ marginTop: 8 }}>
            💡 The voice selected here is saved to this device and used whenever students hear spelling bee words in Practice Mode or the Quiz.
          </div>
        </div>
      )}

      {/* ── PRACTICE TAB ── */}
      {tab === 'practice' && (
        <>
          <div className={styles.practiceNote}>💡 Practice questions are for students studying at home. They include an optional hint.</div>
          <div className={styles.list}>
            {practiceLoad ? <p className={styles.listEmpty}>Loading…</p>
              : practiceQs.length === 0 ? <p className={styles.listEmpty}>No practice questions yet.</p>
              : practiceQs.map((q, i) => (
                <div key={q.id} className={styles.item}>
                  {editingP === q.id ? (
                    <div className={styles.editForm}>
                      <textarea className={styles.editInput} value={editPVal.q} onChange={e => setEditPVal(v => ({ ...v, q: e.target.value }))} rows={2} />
                      <input className={styles.editInput} value={editPVal.a} onChange={e => setEditPVal(v => ({ ...v, a: e.target.value }))} placeholder="Answer" />
                      <input className={styles.editInput} value={editPVal.hint} onChange={e => setEditPVal(v => ({ ...v, hint: e.target.value }))} placeholder="Hint (optional)" />
                      <div className={styles.editBtns}>
                        <button className="btn btn-green btn-sm" onClick={() => saveEditPractice(q.id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingP(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.qInfo}>
                        <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                        <span className={styles.qAns}>✓ {q.answer}</span>
                        {q.hint && <span className={styles.qHint}>💡 {q.hint}</span>}
                      </div>
                      <div className={styles.itemBtns}>
                        <button className={styles.editBtn} onClick={() => startEditPractice(q)}>✏ Edit</button>
                        <button className={styles.delBtn} onClick={() => handleDeletePractice(q.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            }
          </div>
          <div className={styles.addForm}>
            <h3 className={styles.addTitle}>➕ Add Practice Question</h3>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Question / Word</label>
                <textarea value={pNewQ} onChange={e => setPNewQ(e.target.value)} placeholder="Enter question…" rows={3} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Answer</label>
                <textarea value={pNewA} onChange={e => setPNewA(e.target.value)} placeholder="Correct answer…" rows={3} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Hint <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(optional)</span></label>
              <input type="text" value={pNewHint} onChange={e => setPNewHint(e.target.value)} placeholder="e.g. Think about water…" />
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
