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
type AdminTab = 'quiz' | 'practice' | 'spelling' | 'settings'

// ── Spelling word types ──
interface SpellingWord {
  id: string
  word: string
  section: string
  hint: string | null
  created_at: string
}

// ── Spelling Words Tab ──────────────────────────────────────────────────────
function SpellingWordsTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [words,       setWords]       = useState<SpellingWord[]>([])
  const [loading,     setLoading]     = useState(false)
  const [section,     setSection]     = useState<string>(SECTIONS[0])
  const [newWord,     setNewWord]     = useState('')
  const [newHint,     setNewHint]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editVal,     setEditVal]     = useState({ word: '', hint: '' })
  const [csvText,     setCsvText]     = useState('')
  const [csvParsed,   setCsvParsed]   = useState<{ word: string; hint: string }[]>([])
  const [csvImporting,setCsvImporting]= useState(false)
  const [showCsv,     setShowCsv]     = useState(false)
  const csvFileRef = useRef<HTMLInputElement>(null)

  const loadWords = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('spelling_words')
      .select('*')
      .eq('section', section)
      .order('word', { ascending: true })
    setWords((data ?? []) as SpellingWord[])
    setLoading(false)
  }, [section])

  useEffect(() => { loadWords() }, [loadWords])

  async function handleAdd() {
    if (!newWord.trim()) { showToast('Enter a word', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('spelling_words').insert({
      word: newWord.trim().toUpperCase(),
      section,
      hint: newHint.trim() || null,
    })
    if (error) { showToast('Error adding word', 'error') }
    else { showToast('Word added!', 'success'); setNewWord(''); setNewHint(''); loadWords() }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this word?')) return
    const { error } = await supabase.from('spelling_words').delete().eq('id', id)
    if (error) showToast('Error deleting', 'error')
    else { showToast('Deleted', 'success'); loadWords() }
  }

  function startEdit(w: SpellingWord) {
    setEditingId(w.id)
    setEditVal({ word: w.word, hint: w.hint ?? '' })
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from('spelling_words').update({
      word: editVal.word.trim().toUpperCase(),
      hint: editVal.hint.trim() || null,
    }).eq('id', id)
    if (error) showToast('Error updating', 'error')
    else { showToast('Updated!', 'success'); setEditingId(null); loadWords() }
  }

  function parseCsv(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const rows = lines.map(line => {
      const cols: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ }
        else if (line[i] === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
        else cur += line[i]
      }
      cols.push(cur.trim())
      return cols
    }).filter(r => r.length >= 1 && r[0])
    setCsvParsed(rows.map(r => ({ word: r[0].toUpperCase(), hint: r[1] ?? '' })))
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { const text = ev.target?.result as string; setCsvText(text); parseCsv(text) }
    reader.readAsText(file)
  }

  async function handleImportCsv() {
    if (!csvParsed.length) return
    setCsvImporting(true)
    const rows = csvParsed.map(r => ({ word: r.word, section, hint: r.hint || null }))
    const { error } = await supabase.from('spelling_words').insert(rows)
    if (error) showToast('Import failed', 'error')
    else { showToast(`✅ Imported ${rows.length} words!`, 'success'); setCsvText(''); setCsvParsed([]); setShowCsv(false); loadWords() }
    setCsvImporting(false)
  }

  return (
    <div>
      {/* Section + CSV toggle */}
      <div className="form-row" style={{ maxWidth: 540, marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Section</label>
          <select value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end', paddingTop: 22 }}>
          <button className={`btn btn-sm ${showCsv ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowCsv(t => !t)}>
            📥 CSV Import
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        🔤 Spelling Words — <strong>{section}</strong> · <strong>{words.length}</strong> words
      </div>

      {/* CSV panel */}
      {showCsv && (
        <div className={styles.csvPanel}>
          <h3 className={styles.csvTitle}>📥 Bulk Import Spelling Words</h3>
          <p className={styles.csvHint}>
            Format: <code>word, hint (optional)</code><br />
            One word per line. No header row needed. Words will be uppercased automatically.
          </p>
          <div className={styles.csvActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => csvFileRef.current?.click()}>📂 Upload CSV</button>
            <input ref={csvFileRef} type="file" accept=".csv,.txt" onChange={handleCsvFile} style={{ display: 'none' }} />
          </div>
          <textarea className={styles.csvTextarea} value={csvText}
            onChange={e => { setCsvText(e.target.value); parseCsv(e.target.value) }}
            placeholder={`ELEPHANT, a large African animal\nBUTTERFLY, a beautiful insect\nKNOWLEDGE`}
            rows={5} />
          {csvParsed.length > 0 && (
            <div className={styles.csvPreview}>
              <p className={styles.csvPreviewTitle}>✅ {csvParsed.length} words ready to import into <strong>{section}</strong></p>
              <div className={styles.csvPreviewList}>
                {csvParsed.slice(0, 5).map((r, i) => (
                  <div key={i} className={styles.csvPreviewRow}>
                    <span className={styles.csvPreviewQ}>{i + 1}. {r.word}</span>
                    {r.hint && <span className={styles.csvPreviewA}>💡 {r.hint}</span>}
                  </div>
                ))}
                {csvParsed.length > 5 && <p className={styles.csvMore}>…and {csvParsed.length - 5} more</p>}
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleImportCsv} disabled={csvImporting}>
                {csvImporting ? 'Importing…' : `⬆ Import ${csvParsed.length} Words`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Word list */}
      <div className={styles.list}>
        {loading ? <p className={styles.listEmpty}>Loading…</p>
          : words.length === 0 ? <p className={styles.listEmpty}>No words yet for this section.</p>
          : words.map((w, i) => (
            <div key={w.id} className={styles.item}>
              {editingId === w.id ? (
                <div className={styles.editForm}>
                  <input className={styles.editInput} value={editVal.word}
                    onChange={e => setEditVal(v => ({ ...v, word: e.target.value }))} placeholder="Word" />
                  <input className={styles.editInput} value={editVal.hint}
                    onChange={e => setEditVal(v => ({ ...v, hint: e.target.value }))} placeholder="Hint (optional)" />
                  <div className={styles.editBtns}>
                    <button className="btn btn-green btn-sm" onClick={() => saveEdit(w.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.qInfo}>
                    <strong className={styles.qText}>{i + 1}. {w.word}</strong>
                    {w.hint && <span className={styles.qHint}>💡 {w.hint}</span>}
                  </div>
                  <div className={styles.itemBtns}>
                    <button className={styles.editBtn} onClick={() => startEdit(w)}>✏ Edit</button>
                    <button className={styles.delBtn} onClick={() => handleDelete(w.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        }
      </div>

      {/* Add word form */}
      <div className={styles.addForm}>
        <h3 className={styles.addTitle}>➕ Add Spelling Word</h3>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Word</label>
            <input type="text" value={newWord} onChange={e => setNewWord(e.target.value)}
              placeholder="e.g. ELEPHANT" autoCapitalize="characters" />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Hint <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(optional)</span></label>
            <input type="text" value={newHint} onChange={e => setNewHint(e.target.value)}
              placeholder="e.g. a large African animal with a trunk" />
          </div>
        </div>
        <button className="btn btn-green btn-sm" onClick={handleAdd} disabled={saving}>
          {saving ? 'Saving…' : '+ Add Word'}
        </button>
      </div>
    </div>
  )
}

// ── Edit question in place ──
async function updateQuestion(id: string, question: string, answer: string, difficulty?: string, hint?: string) {
  const { error } = await supabase.from('questions').update({ question, answer, difficulty: difficulty || null, hint: hint || null }).eq('id', id)
  if (error) throw error
}
async function updatePracticeQuestion(id: string, question: string, answer: string, hint: string) {
  const { error } = await supabase.from('practice_questions').update({ question, answer, hint }).eq('id', id)
  if (error) throw error
}
async function updateQuestionDifficulty(ids: string[], difficulty: string) {
  const { error } = await supabase.from('questions').update({ difficulty }).in('id', ids)
  if (error) throw error
}
async function deleteAllQuestions() {
  const response = await fetch('/api/admin-delete-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteAll: true })
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete all questions')
  }
  return response.json()
}
async function deleteQuestionsByIds(ids: string[]) {
  const response = await fetch('/api/admin-delete-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to delete questions')
  }
  return response.json()
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
  const [qNewDiff, setQNewDiff]  = useState('')
  const [qNewHint, setQNewHint]  = useState('')
  const [qSaving,  setQSaving]   = useState(false)
  const [editingQ, setEditingQ]  = useState<string | null>(null)
  const [editQVal, setEditQVal]  = useState({ q: '', a: '', diff: '', hint: '' })

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
  const [csvParsed,    setCsvParsed]    = useState<{q:string;a:string;hint?:string;difficulty?:string}[]>([])
  const [csvImporting, setCsvImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Bulk tagger
  const [showBulkTagger, setShowBulkTagger] = useState(false)
  const [bulkDiffFilter, setBulkDiffFilter] = useState<string>('')
  const [selectedQIds, setSelectedQIds] = useState<Set<string>>(new Set())
  const [bulkDifficulty, setBulkDifficulty] = useState<string>('')
  const [bulkApplying, setBulkApplying] = useState(false)

  // Bulk delete
  const [showDeleteZone, setShowDeleteZone] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    if (!qNewQ.trim() || !qNewA.trim()) { showToast('Fill question and answer', 'error'); return }
    setQSaving(true)
    try { 
      await addQuestion({ 
        section, 
        category, 
        question: qNewQ.trim(), 
        answer: qNewA.trim(),
        ...(qNewDiff ? { difficulty: qNewDiff } : {}),
        ...(qNewHint ? { hint: qNewHint } : {})
      }); 
      showToast('Added!', 'success'); 
      setQNewQ(''); 
      setQNewA(''); 
      setQNewDiff('');
      setQNewHint('');
      loadQuiz() 
    }
    catch { showToast('Error', 'error') } 
    finally { setQSaving(false) }
  }
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); showToast('Deleted', 'success'); loadQuiz() }
    catch { showToast('Error', 'error') }
  }
  const startEditQuiz = (q: Question) => { setEditingQ(q.id); setEditQVal({ q: q.question, a: q.answer, diff: q.difficulty || '', hint: q.hint || '' }) }
  const saveEditQuiz = async (id: string) => {
    try { await updateQuestion(id, editQVal.q, editQVal.a, editQVal.diff || undefined, editQVal.hint || undefined); showToast('Updated!', 'success'); setEditingQ(null); loadQuiz() }
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
    setCsvParsed(rows.map(r => {
      // Support optional difficulty and hint columns (case-insensitive)
      // Format: question, answer, [hint], [difficulty]
      let hint = ''
      let difficulty = ''
      
      if (tab === 'quiz') {
        // For quiz: question, answer, [hint], [difficulty]
        // Columns can be in any order, we detect by content
        hint = r[2] ?? ''
        difficulty = r[3] ? r[3].toLowerCase().trim() : ''
        
        // Validate difficulty if present
        const validDifficulties = ['easy', 'moderate', 'hard', 'champion']
        if (difficulty && !validDifficulties.includes(difficulty)) {
          difficulty = ''
        }
      } else {
        // For practice: question, answer, [hint]
        hint = r[2] ?? ''
      }
      
      return { 
        q: r[0], 
        a: r[1], 
        hint: hint,
        difficulty: difficulty
      }
    }))
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
      const rows = csvParsed.map(r => {
        const row: any = {
          section, category,
          question: r.q, 
          answer: r.a,
        }
        
        // Add hint if present and not empty
        if (r.hint) {
          row.hint = r.hint
        } else if (tab === 'practice') {
          row.hint = null
        }
        
        // Add difficulty if present and not empty (quiz only)
        if (tab === 'quiz' && r.difficulty) {
          row.difficulty = r.difficulty
        } else if (tab === 'quiz') {
          row.difficulty = null
        }
        
        return row
      })
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
      {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
        <div style={{
          width: '100%',
          backgroundColor: '#FFD70022',
          border: '2px solid #FFD700',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '12px',
          marginBottom: '16px',
          color: '#fff',
          fontSize: '0.95rem',
          fontWeight: 500,
          lineHeight: 1.4
        }}>
          ⚠️ Supabase is not configured. Open <code style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> and add your <strong>NEXT_PUBLIC_SUPABASE_URL</strong>, <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> and <strong>SUPABASE_SERVICE_ROLE_KEY</strong> values before using the admin panel.
        </div>
      )}

      <div className={styles.topBar}>
        <h1 className={styles.title}>⚙ Admin Panel</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(tab === 'quiz' || tab === 'practice') && (
          <button className={`btn btn-sm ${csvTab ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCsvTab(t => !t)}>
            📥 CSV Import
          </button>
          )}
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
        <button className={`${styles.tab} ${tab === 'spelling' ? styles.tabActive : ''}`} onClick={() => setTab('spelling')}>
          🔤 Spelling Words
        </button>
        <button className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`} onClick={() => setTab('settings')}>
          ⚙ Settings
        </button>
      </div>

      {/* Filters — only for quiz/practice tabs */}
      {(tab === 'quiz' || tab === 'practice') && (
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
      )}

      {(tab === 'quiz' || tab === 'practice') && (
      <div className={styles.stats}>
        {tab === 'quiz' ? '🎮 Quiz' : '📚 Practice'} — <strong>{CATEGORY_ICONS[category]} {category}</strong> · <strong>{section}</strong> · <strong>{tab === 'quiz' ? quizQs.length : practiceQs.length}</strong> questions
      </div>
      )}

      {/* CSV Import panel — quiz/practice only */}
      {csvTab && (tab === 'quiz' || tab === 'practice') && (
        <div className={styles.csvPanel}>
          <h3 className={styles.csvTitle}>📥 Bulk Import via CSV</h3>
          <p className={styles.csvHint}>
            Format: <code>question, answer{tab === 'practice' ? ', hint (optional)' : ', hint (optional), difficulty (optional: easy/moderate/hard/champion)'}</code><br />
            One question per line. No header row needed. Difficulty values are case-insensitive. Missing or blank columns remain null.
          </p>
          <div className={styles.csvActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>📂 Upload CSV File</button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSVFile} style={{ display: 'none' }} />
          </div>
          <textarea className={styles.csvTextarea} value={csvText}
            onChange={e => { setCsvText(e.target.value); parseCSV(e.target.value) }}
            placeholder={tab === 'quiz' ? `What is 2 + 2, 4, , easy\nSpell "beautiful", beautiful, a nice word, moderate\nWho is the president of Nigeria, Bola Tinubu` : `What is 2 + 2, 4, Think about fingers\nSpell "beautiful", beautiful, a nice word`}
            rows={6} />
          {csvParsed.length > 0 && (
            <div className={styles.csvPreview}>
              <p className={styles.csvPreviewTitle}>✅ {csvParsed.length} questions ready to import into <strong>{section} / {category}</strong></p>
              <div className={styles.csvPreviewList}>
                {csvParsed.slice(0, 5).map((r, i) => (
                  <div key={i} className={styles.csvPreviewRow}>
                    <span className={styles.csvPreviewQ}>{i + 1}. {r.q}</span>
                    <span className={styles.csvPreviewA}>→ {r.a}</span>
                    {r.hint && <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>💡 {r.hint}</span>}
                    {tab === 'quiz' && r.difficulty && <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>⭐ {r.difficulty}</span>}
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
          {/* Bulk tagger */}
          <div style={{ marginBottom: 20 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowBulkTagger(!showBulkTagger)}>
              🏷 {showBulkTagger ? 'Hide' : 'Show'} Bulk Tagger
            </button>
            {showBulkTagger && (
              <div className={styles.bulkTaggerPanel}>
                <h3 className={styles.bulkTaggerTitle}>🏷 Bulk Difficulty Tagger</h3>
                <p className={styles.bulkTaggerDesc}>
                  Filter questions by section, category, or difficulty status, then select and apply a new difficulty level to multiple questions at once.
                </p>
                <div className="form-row" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Filter by Difficulty</label>
                    <select value={bulkDiffFilter} onChange={e => { setBulkDiffFilter(e.target.value); setSelectedQIds(new Set()) }}>
                      <option value="">All Questions</option>
                      <option value="untagged">Untagged Only</option>
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                      <option value="champion">Champion</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Set Difficulty To</label>
                    <select value={bulkDifficulty} onChange={e => setBulkDifficulty(e.target.value)}>
                      <option value="">— Select —</option>
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                      <option value="champion">Champion</option>
                    </select>
                  </div>
                </div>
                <div className={styles.bulkSelectAll}>
                  <input type="checkbox" id="selectAllBulk" 
                    checked={selectedQIds.size > 0 && selectedQIds.size === quizQs.filter(q => !bulkDiffFilter || (bulkDiffFilter === 'untagged' ? !q.difficulty : q.difficulty === bulkDiffFilter)).length}
                    onChange={e => {
                      if (e.target.checked) {
                        const filtered = quizQs.filter(q => !bulkDiffFilter || (bulkDiffFilter === 'untagged' ? !q.difficulty : q.difficulty === bulkDiffFilter))
                        setSelectedQIds(new Set(filtered.map(q => q.id)))
                      } else {
                        setSelectedQIds(new Set())
                      }
                    }}
                  />
                  <label htmlFor="selectAllBulk" className={styles.bulkSelectAllLabel}>
                    Select All ({quizQs.filter(q => !bulkDiffFilter || (bulkDiffFilter === 'untagged' ? !q.difficulty : q.difficulty === bulkDiffFilter)).length})
                  </label>
                </div>
                <button className="btn btn-primary btn-sm" onClick={async () => {
                  if (!bulkDifficulty || selectedQIds.size === 0) { showToast('Select questions and difficulty', 'error'); return }
                  setBulkApplying(true)
                  try {
                    await updateQuestionDifficulty(Array.from(selectedQIds), bulkDifficulty)
                    const selectedCount = selectedQIds.size
                    showToast(`✅ Updated ${selectedCount} ${selectedCount === 1 ? 'question' : 'questions'} to ${bulkDifficulty}!`, 'success')
                    setSelectedQIds(new Set())
                    setBulkDifficulty('')
                    loadQuiz()
                  } catch { showToast('Error updating', 'error') }
                  finally { setBulkApplying(false) }
                }} disabled={bulkApplying || selectedQIds.size === 0 || !bulkDifficulty}>
                  {bulkApplying ? 'Applying…' : `Apply to ${selectedQIds.size} Selected`}
                </button>
              </div>
            )}
          </div>

          {/* Table header */}
          <div className={styles.tableHeader}>
            <div className={styles.tableCol} style={{ flex: 1 }}>Question</div>
            <div className={styles.tableCol} style={{ width: 100 }}>Difficulty</div>
            <div className={styles.tableCol} style={{ width: 80 }}>Actions</div>
          </div>

          <div className={styles.list}>
            {quizLoad ? <p className={styles.listEmpty}>Loading…</p>
              : quizQs.length === 0 ? <p className={styles.listEmpty}>No questions yet.</p>
              : quizQs.filter(q => !bulkDiffFilter || (bulkDiffFilter === 'untagged' ? !q.difficulty : q.difficulty === bulkDiffFilter)).map((q, i) => (
                <div key={q.id} className={styles.item}>
                  {editingQ === q.id ? (
                    <div className={styles.editForm}>
                      <textarea className={styles.editInput} value={editQVal.q} onChange={e => setEditQVal(v => ({ ...v, q: e.target.value }))} rows={2} placeholder="Question" />
                      <input className={styles.editInput} value={editQVal.a} onChange={e => setEditQVal(v => ({ ...v, a: e.target.value }))} placeholder="Answer" />
                      <select className={styles.editInput} value={editQVal.diff} onChange={e => setEditQVal(v => ({ ...v, diff: e.target.value }))}>
                        <option value="">None</option>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                        <option value="champion">Champion</option>
                      </select>
                      <input className={styles.editInput} value={editQVal.hint} onChange={e => setEditQVal(v => ({ ...v, hint: e.target.value }))} placeholder="Hint (optional)" />
                      <div className={styles.editBtns}>
                        <button className="btn btn-green btn-sm" onClick={() => saveEditQuiz(q.id)}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingQ(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1 }}>
                        {showBulkTagger && (
                          <input type="checkbox" 
                            checked={selectedQIds.has(q.id)}
                            onChange={e => {
                              const newSet = new Set(selectedQIds)
                              if (e.target.checked) newSet.add(q.id)
                              else newSet.delete(q.id)
                              setSelectedQIds(newSet)
                            }}
                            style={{ marginTop: 4, flexShrink: 0 }}
                          />
                        )}
                        <div className={styles.qInfo} style={{ flex: 1 }}>
                          <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                          <span className={styles.qAns}>✓ {q.answer}</span>
                          {q.hint && <span className={styles.qHint}>💡 {q.hint}</span>}
                        </div>
                      </div>
                      <div style={{ width: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {q.difficulty ? (
                          <span className={styles.diffBadge} data-difficulty={q.difficulty}>
                            {q.difficulty.toUpperCase()}
                          </span>
                        ) : (
                          <span className={styles.diffBadgeUntagged}>—</span>
                        )}
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
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Difficulty <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(optional)</span></label>
                <select value={qNewDiff} onChange={e => setQNewDiff(e.target.value)}>
                  <option value="">None</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                  <option value="champion">Champion</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hint <span style={{ fontWeight: 400, color: 'var(--text2)' }}>(optional)</span></label>
                <input type="text" value={qNewHint} onChange={e => setQNewHint(e.target.value)} placeholder="e.g. Think about water…" />
              </div>
            </div>
            <button className="btn btn-green btn-sm" onClick={handleAddQuiz} disabled={qSaving}>
              {qSaving ? 'Saving…' : '+ Add Question'}
            </button>
          </div>

          {/* Danger zone */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid #C8102E33' }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowDeleteZone(!showDeleteZone)} style={{ color: '#C8102E', fontWeight: 700 }}>
              ⚠ {showDeleteZone ? 'Hide' : 'Show'} Danger Zone
            </button>
            {showDeleteZone && (
              <div className={styles.dangerZone}>
                <h3 className={styles.dangerZoneTitle}>🗑 Danger Zone</h3>
                <p className={styles.dangerZoneDesc}>Permanent deletion of questions. These actions cannot be undone.</p>
                
                {/* Delete selected */}
                <div className={styles.dangerZoneSection}>
                  <div>
                    <h4 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Delete Selected Questions</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>
                      {selectedQIds.size === 0 
                        ? 'Select questions using the bulk tagger to delete them.'
                        : `${selectedQIds.size} question${selectedQIds.size === 1 ? '' : 's'} selected for deletion.`
                      }
                    </p>
                  </div>
                  <button 
                    className={`btn btn-sm ${selectedQIds.size > 0 ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => {
                      if (selectedQIds.size === 0) { showToast('Select questions first', 'error'); return }
                      setDeleteConfirmText('') // Use this for selected confirmation
                      // Show confirmation modal for selected
                      if (confirm(`Are you sure? This will delete ${selectedQIds.size} question${selectedQIds.size === 1 ? '' : 's'} permanently. This cannot be undone.`)) {
                        (async () => {
                          setDeleting(true)
                          try {
                            await deleteQuestionsByIds(Array.from(selectedQIds))
                            showToast(`✅ Deleted ${selectedQIds.size} question${selectedQIds.size === 1 ? '' : 's'}!`, 'success')
                            setSelectedQIds(new Set())
                            loadQuiz()
                          } catch (err: any) { showToast(err.message || 'Error deleting', 'error') }
                          finally { setDeleting(false) }
                        })()
                      }
                    }}
                    disabled={deleting || selectedQIds.size === 0}
                    style={{ minWidth: 160 }}
                  >
                    {deleting ? 'Deleting…' : `Delete ${selectedQIds.size} Selected`}
                  </button>
                </div>

                {/* Delete all */}
                <div className={styles.dangerZoneSection} style={{ borderTop: '1px solid #C8102E44', paddingTop: 16 }}>
                  <div>
                    <h4 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>Delete All Questions</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>
                      Delete ALL questions in <strong>{section} / {category}</strong>. Type "DELETE" to confirm.
                    </p>
                  </div>
                  {!deleteAllConfirm ? (
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeleteAllConfirm(true)}
                      style={{ minWidth: 160 }}
                    >
                      Delete All
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 300 }}>
                      <input 
                        type="text" 
                        placeholder="Type DELETE" 
                        value={deleteConfirmText} 
                        onChange={e => setDeleteConfirmText(e.target.value)} 
                        autoFocus
                        style={{ 
                          flex: 1, 
                          padding: '8px 12px', 
                          borderRadius: 'var(--radius-sm)', 
                          border: deleteConfirmText === 'DELETE' ? '2px solid var(--green)' : '2px solid var(--danger)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      />
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={async () => {
                          if (deleteConfirmText !== 'DELETE') { showToast('Type DELETE exactly', 'error'); return }
                          setDeleting(true)
                          try {
                            await deleteAllQuestions()
                            showToast('✅ All questions deleted!', 'success')
                            setDeleteAllConfirm(false)
                            setDeleteConfirmText('')
                            loadQuiz()
                          } catch (err: any) { showToast(err.message || 'Error deleting', 'error') }
                          finally { setDeleting(false) }
                        }} 
                        disabled={deleting || deleteConfirmText !== 'DELETE'}
                        style={{ minWidth: 120 }}
                      >
                        {deleting ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setDeleteAllConfirm(false); setDeleteConfirmText('') }}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SPELLING TAB ── */}
      {tab === 'spelling' && <SpellingWordsTab showToast={showToast} />}

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
