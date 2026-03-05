'use client'
import { useState, useEffect, useCallback } from 'react'
import { getQuestions, addQuestion, deleteQuestion, SECTIONS, CATEGORIES, CATEGORY_ICONS, Question, Section, Category } from '../../lib/questions'
import { useToast } from '../../context/ToastContext'
import styles from './page.module.css'

export default function AdminPage() {
  const { showToast } = useToast()
  const [section,  setSection]  = useState<Section>(SECTIONS[0])
  const [category, setCategory] = useState<Category>(CATEGORIES[0])
  const [questions, setQs]      = useState<Question[]>([])
  const [loading,  setLoading]  = useState(false)
  const [newQ,     setNewQ]     = useState('')
  const [newA,     setNewA]     = useState('')
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setQs(await getQuestions(section, category)) }
    catch { showToast('Error loading', 'error') }
    finally { setLoading(false) }
  }, [section, category])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return
    try {
      await deleteQuestion(id)
      showToast('Deleted', 'success')
      load()
    } catch { showToast('Error', 'error') }
  }

  const handleAdd = async () => {
    if (!newQ.trim() || !newA.trim()) { showToast('Fill both fields', 'error'); return }
    setSaving(true)
    try {
      await addQuestion({ section, category, question: newQ.trim(), answer: newA.trim() })
      showToast('Question added!', 'success')
      setNewQ(''); setNewA('')
      load()
    } catch { showToast('Error saving', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1 className={styles.title}>⚙ Admin Panel</h1>

      {/* Filters */}
      <div className="form-row" style={{ maxWidth: 540, marginBottom: 20 }}>
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

      {/* Stats */}
      <div className={styles.stats}>
        Showing <strong>{CATEGORY_ICONS[category]} {category}</strong> — <strong>{section}</strong>
        &emsp;·&emsp;<strong>{questions.length}</strong> questions
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading
          ? <p style={{ color: 'var(--text2)', padding: 16 }}>Loading…</p>
          : questions.length === 0
            ? <p style={{ color: 'var(--text3)', fontStyle: 'italic', padding: 16 }}>No questions yet.</p>
            : questions.map((q, i) => (
                <div key={q.id} className={styles.item}>
                  <div className={styles.qInfo}>
                    <strong className={styles.qText}>{i + 1}. {q.question}</strong>
                    <span className={styles.qAns}>✓ {q.answer}</span>
                  </div>
                  <button className={styles.delBtn} onClick={() => handleDelete(q.id)}>Delete</button>
                </div>
              ))
        }
      </div>

      {/* Add form */}
      <div className={styles.addForm}>
        <h3 className={styles.addTitle}>➕ Add Question</h3>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Question / Word</label>
            <textarea value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Enter question here…" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Answer</label>
            <textarea value={newA} onChange={e => setNewA(e.target.value)} placeholder="Correct answer…" />
          </div>
        </div>
        <button className="btn btn-green btn-sm" onClick={handleAdd} disabled={saving}>
          {saving ? 'Saving…' : 'Add Question'}
        </button>
      </div>
    </div>
  )
}
