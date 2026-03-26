'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGame } from '@/context/GameContext'
import { SECTIONS, Section } from '@/lib/questions'
import { Team, Round } from '@/lib/types'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import AdminGate from '@/components/ui/AdminGate'
import styles from './page.module.css'

const PRESET_COLORS = [
  '#C8102E','#003580','#FFD700','#00C853',
  '#00B0FF','#FF6D00','#AA00FF','#F50057',
  '#00BFA5','#FF4081','#6200EA','#1565C0',
]
const DEFAULT_TEAMS: Team[] = [
  { name: 'Team Red',  color: '#C8102E' },
  { name: 'Team Blue', color: '#003580' },
  { name: 'Team Gold', color: '#FFD700' },
]
const MAX_TEAMS = 10

// ── Photo capture modal ──
function PhotoModal({ name, onCapture, onClose }: {
  name: string
  onCapture: (dataUrl: string) => void
  onClose: () => void
}) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const [camOn,    setCamOn]    = useState(false)
  const [camError, setCamError] = useState('')
  const [preview,  setPreview]  = useState('')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCamOn(true); setCamError('')
    } catch { setCamError('Camera not available. Please upload a photo instead.') }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamOn(false)
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current
    const c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    setPreview(c.toDataURL('image/jpeg', 0.85))
    stopCamera()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleConfirm = () => { onCapture(preview); onClose() }

  useEffect(() => () => stopCamera(), [])

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.photoModal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.photoModalTitle}>📸 Photo for {name || 'Participant'}</h3>

        {!preview ? (
          <>
            {camOn ? (
              <div className={styles.videoWrap}>
                <video ref={videoRef} autoPlay playsInline className={styles.video} />
                <button className="btn btn-primary" onClick={takePhoto}>📸 Take Photo</button>
                <button className="btn btn-ghost btn-sm" onClick={stopCamera}>Cancel Camera</button>
              </div>
            ) : (
              <div className={styles.photoOptions}>
                <button className={styles.photoOptBtn} onClick={startCamera}>
                  <span className={styles.photoOptIcon}>📷</span>
                  <span>Use Camera</span>
                </button>
                <div className={styles.photoOptOr}>or</div>
                <button className={styles.photoOptBtn} onClick={() => fileRef.current?.click()}>
                  <span className={styles.photoOptIcon}>🖼</span>
                  <span>Upload Photo</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
              </div>
            )}
            {camError && <p className={styles.camError}>{camError}</p>}
          </>
        ) : (
          <div className={styles.previewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className={styles.previewImg} />
            <div className={styles.previewBtns}>
              <button className="btn btn-primary" onClick={handleConfirm}>✓ Use This Photo</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPreview(''); startCamera() }}>Retake</button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button className={styles.modalClose} onClick={onClose}>✕</button>
      </div>
    </div>
  )
}

function SetupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { startGame } = useGame()
  const { authed, checked } = useAdminAuth()

  const [showGate,    setShowGate]    = useState(false)
  const [section,     setSection]     = useState<Section>(SECTIONS[0])
  const [round,       setRound]       = useState<Round>('round1')
  const [pointsPerQ,  setPoints]      = useState(10)
  const [teams,       setTeams]       = useState<Team[]>(DEFAULT_TEAMS)
  const [colorPicker, setColorPicker] = useState<number | null>(null)
  const [photoModal,  setPhotoModal]  = useState<number | null>(null)

  useEffect(() => {
    const s = params.get('section')
    if (s && SECTIONS.includes(s as Section)) setSection(s as Section)
  }, [params])

  const updateTeam = (i: number, key: keyof Team, val: string) =>
    setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: val } : t))

  const addTeam = () => {
    if (teams.length >= MAX_TEAMS) return
    setTeams(prev => [...prev, { name: '', color: PRESET_COLORS[prev.length % PRESET_COLORS.length] }])
  }

  const removeTeam = (i: number) => {
    if (teams.length <= 2) return
    setTeams(prev => prev.filter((_, idx) => idx !== i))
    if (colorPicker === i) setColorPicker(null)
    if (photoModal === i) setPhotoModal(null)
  }

  const handleStartClick = () => {
    const empty = teams.findIndex(t => !t.name.trim())
    if (empty !== -1) { alert(`Please enter a name for participant ${empty + 1}`); return }
    if (authed) doStart(); else setShowGate(true)
  }

  const doStart = () => {
    startGame({ section, round, pointsPerQ: Number(pointsPerQ) || 10, teams })
    router.push('/quiz')
  }

  if (!checked) return null

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {showGate && (
        <AdminGate title="Host Access Required" subtitle="Enter the admin password to start a Solo Quiz"
          onAuthed={() => { setShowGate(false); doStart() }} onCancel={() => setShowGate(false)} />
      )}
      {photoModal !== null && (
        <PhotoModal
          name={teams[photoModal]?.name}
          onCapture={url => updateTeam(photoModal, 'photo', url)}
          onClose={() => setPhotoModal(null)}
        />
      )}

      <h1 className={styles.title}>🏆 Game Setup</h1>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Grade Section</label>
            <select value={section} onChange={e => setSection(e.target.value as Section)}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Round Type</label>
            <select value={round} onChange={e => setRound(e.target.value as Round)}>
              <option value="round1">Round 1 — Pick a Number</option>
              <option value="round2">Round 2 — Fastest Fingers</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: 120 }}>
            <label className="form-label">Points / Q</label>
            <input type="number" min={1} max={100} value={pointsPerQ}
              onChange={e => setPoints(Number(e.target.value))} />
          </div>
        </div>

        <div className={styles.teamsHeader}>
          <p className="form-label" style={{ margin: 0 }}>
            Participants
            <span className={styles.teamCount}>{teams.length} / {MAX_TEAMS}</span>
          </p>
          <button className={styles.addBtn} onClick={addTeam} disabled={teams.length >= MAX_TEAMS} type="button">
            + Add Participant
          </button>
        </div>

        <div className={styles.teams}>
          {teams.map((team, i) => (
            <div key={i} className={styles.teamRow}>
              <span className={styles.teamNum}>{i + 1}</span>

              {/* Photo */}
              <button className={styles.photoThumb} onClick={() => setPhotoModal(i)} type="button"
                title="Add photo">
                {team.photo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={team.photo} alt={team.name} className={styles.photoImg} />
                  : <span className={styles.photoPlaceholder}>📸</span>
                }
              </button>

              {/* Colour swatch */}
              <button className={styles.swatchBtn} style={{ background: team.color }}
                onClick={() => setColorPicker(colorPicker === i ? null : i)} type="button" />

              {/* Name */}
              <input type="text" value={team.name} placeholder={`Participant ${i + 1}`}
                onChange={e => updateTeam(i, 'name', e.target.value)}
                className={styles.nameInput} maxLength={30} />

              {/* Remove */}
              <button className={styles.removeBtn} onClick={() => removeTeam(i)}
                disabled={teams.length <= 2} type="button" title="Remove">✕</button>

              {/* Colour picker dropdown */}
              {colorPicker === i && (
                <div className={styles.colorDropdown}>
                  <p className={styles.colorDropdownLabel}>Pick a colour</p>
                  <div className={styles.colorGrid}>
                    {PRESET_COLORS.map(c => (
                      <button key={c}
                        className={`${styles.colorDot} ${team.color === c ? styles.colorDotActive : ''}`}
                        style={{ background: c }}
                        onClick={() => { updateTeam(i, 'color', c); setColorPicker(null) }} type="button" />
                    ))}
                  </div>
                  <div className={styles.customColorRow}>
                    <span className={styles.customColorLabel}>Custom:</span>
                    <input type="color" value={team.color}
                      onChange={e => updateTeam(i, 'color', e.target.value)} className={styles.colorPicker} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length < MAX_TEAMS && (
          <button className={styles.addBtnBottom} onClick={addTeam} type="button">
            + Add Another Participant
          </button>
        )}

        <div className={styles.startRow}>
          <button className="btn btn-primary btn-lg" onClick={handleStartClick}>
            🚀 Start Quiz ({teams.length} participants)
          </button>
          {!authed && <p className={styles.lockNote}>🔒 Admin password required</p>}
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <SetupForm />
    </Suspense>
  )
}
