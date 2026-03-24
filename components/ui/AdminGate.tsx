'use client'
import { useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import styles from './AdminGate.module.css'

interface Props {
  title?: string
  subtitle?: string
  onAuthed: () => void
  onCancel?: () => void
}

export default function AdminGate({ title = 'Admin Required', subtitle = 'Enter the admin password to continue', onAuthed, onCancel }: Props) {
  const { login } = useAdminAuth()
  const [pw,      setPw]      = useState('')
  const [error,   setError]   = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleSubmit = () => {
    if (login(pw)) {
      onAuthed()
    } else {
      setError(true)
      setPw('')
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>🔒</div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.sub}>{subtitle}</p>

        <div className={styles.pwWrap}>
          <input
            type={showPw ? 'text' : 'password'}
            className={`${styles.pwInput} ${shaking ? styles.shake : ''} ${error ? styles.pwError : ''}`}
            placeholder="Enter password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <button className={styles.eyeBtn} onClick={() => setShowPw(p => !p)} type="button">
            {showPw ? '🙈' : '👁'}
          </button>
        </div>

        {error && <p className={styles.errorMsg}>❌ Incorrect password</p>}

        <div className={styles.btnRow}>
          {onCancel && (
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          )}
          <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 1, justifyContent: 'center' }}>
            Unlock
          </button>
        </div>
      </div>
    </div>
  )
}
