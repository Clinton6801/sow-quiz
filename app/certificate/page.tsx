'use client'
import { Suspense, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './page.module.css'

const POSITION_COLORS: Record<string, string> = {
  '1st Place': '#FFD700', '2nd Place': '#C0C0C0', '3rd Place': '#CD7F32',
}
const POSITION_MEDALS: Record<string, string> = {
  '1st Place': '🥇', '2nd Place': '🥈', '3rd Place': '🥉',
}

function CertContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const certRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const winner   = params.get('winner')   ?? 'Champion'
  const score    = params.get('score')    ?? '0'
  const section  = params.get('section')  ?? ''
  const category = params.get('category') ?? 'Quiz Championship'
  const position = params.get('position') ?? ''
  const date     = params.get('date')     ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const photo    = params.get('photo')    ?? ''   // base64 data URL

  const posColor = POSITION_COLORS[position] ?? '#003580'
  const posMedal = POSITION_MEDALS[position] ?? '🏅'

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certRef.current, {
        scale: 3, useCORS: true, backgroundColor: '#ffffff',
        width: 900, height: certRef.current.offsetHeight, windowWidth: 900,
      } as any)
      const link = document.createElement('a')
      link.download = `SOW-Certificate-${winner.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      alert('Could not generate image. Please try again.')
    } finally { setDownloading(false) }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? '⏳ Generating…' : '⬇ Download as Image'}
        </button>
      </div>

      <div className={styles.certOuter}>
        <div className={styles.cert} ref={certRef}>
          <div className={styles.outerBorder}>
            <div className={styles.innerBorder}>

              <div className={styles.topDeco}>
                <div className={styles.decoLine} />
                <span className={styles.decoStar}>✦</span>
                <div className={styles.decoLine} />
              </div>

              {/* Header */}
              <div className={styles.certHeader}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpeg" alt="SOW" className={styles.logo} />
                <div className={styles.schoolInfo}>
                  <p className={styles.schoolName}>Seat of Wisdom Group of Schools</p>
                  <p className={styles.schoolTagline}>Excellence · Knowledge · Character</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpeg" alt="SOW" className={styles.logo} />
              </div>

              <div className={styles.divLine} />

              <p className={styles.certOfAchievement}>Certificate of Achievement</p>
              <p className={styles.certSub}>{category}{section ? ` — ${section}` : ''}</p>
              <p className={styles.thisIs}>This is to certify that</p>

              {/* Participant photo — centered above name */}
              {photo && (
                <div className={styles.photoWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={winner} className={styles.participantPhoto} />
                </div>
              )}

              <div className={styles.winnerBox}>
                <p className={styles.winnerName}>{winner}</p>
              </div>

              {position && (
                <div className={styles.positionBadge} style={{ borderColor: posColor, background: `${posColor}18` }}>
                  <span className={styles.positionMedal}>{posMedal}</span>
                  <span className={styles.positionText} style={{ color: posColor }}>{position}</span>
                </div>
              )}

              <p className={styles.bodyText}>has demonstrated outstanding knowledge and achieved</p>

              <div className={styles.scoreBox}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreLabel}>points</span>
              </div>

              <p className={styles.bodyText}>in the <strong>{category}</strong> Quiz Competition</p>

              <div className={styles.divLine} />

              <div className={styles.certFooter}>
                <div className={styles.sigBox}>
                  <div className={styles.sigLine} />
                  <p className={styles.sigLabel}>Host / Teacher</p>
                </div>
                <div className={styles.dateBox}>
                  <p className={styles.dateVal}>{date}</p>
                  <p className={styles.dateLabel}>Date</p>
                </div>
                <div className={styles.sigBox}>
                  <div className={styles.sigLine} />
                  <p className={styles.sigLabel}>Principal</p>
                </div>
              </div>

              <div className={styles.bottomDeco}><span>✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</span></div>
            </div>
          </div>
        </div>
      </div>
      <p className={styles.hint}>The image will always be the same size regardless of your device</p>
    </div>
  )
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <CertContent />
    </Suspense>
  )
}
