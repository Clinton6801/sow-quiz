'use client'
import { Suspense, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './page.module.css'

function Stars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div className={styles.stars}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < count ? styles.starOn : styles.starOff}>★</span>
      ))}
    </div>
  )
}

function getCategoryIcon(cat: string) {
  if (cat === 'Maths') return '📐'
  if (cat === 'Spelling Bee') return '🐝'
  return '🌍'
}

function getStarLabel(stars: number) {
  if (stars === 5) return 'Outstanding Performance'
  if (stars === 4) return 'Excellent Performance'
  if (stars === 3) return 'Good Performance'
  if (stars === 2) return 'Satisfactory Performance'
  return 'Participation Award'
}

function CertContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const certRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const name     = params.get('name')     ?? 'Student'
  const section  = params.get('section')  ?? ''
  const category = params.get('category') ?? ''
  const score    = params.get('score')    ?? '0'
  const total    = params.get('total')    ?? '0'
  const pct      = params.get('pct')      ?? '0'
  const stars    = parseInt(params.get('stars') ?? '3')
  const date     = params.get('date')     ?? ''

  const starLabel = getStarLabel(stars)
  const catIcon   = getCategoryIcon(category)

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 900,
        height: certRef.current.offsetHeight,
        windowWidth: 900,
      })
      const link = document.createElement('a')
      link.download = `SOW-Practice-Certificate-${name.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      alert('Could not generate image. Please try again.')
      console.error(e)
    } finally {
      setDownloading(false)
    }
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

              <div className={styles.divider} />

              <p className={styles.certTitle}>Certificate of Achievement</p>
              <p className={styles.certSub}>Practice Quiz — {catIcon} {category}</p>
              <p className={styles.presentedTo}>This certificate is proudly presented to</p>

              <div className={styles.nameBox}>
                <p className={styles.studentName}>{name}</p>
              </div>

              <p className={styles.bodyText}>for successfully completing the</p>
              <p className={styles.highlight}>{catIcon} {category} Practice Quiz</p>
              {section && <p className={styles.bodyText}>— <strong>{section}</strong> —</p>}

              <div className={styles.scoreRow}>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreNum}>{score}/{total}</span>
                  <span className={styles.scoreLabel}>Score</span>
                </div>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreNum}>{pct}%</span>
                  <span className={styles.scoreLabel}>Percentage</span>
                </div>
                <div className={styles.scoreBox}>
                  <Stars count={stars} />
                  <span className={styles.scoreLabel}>{starLabel}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.certFooter}>
                <div className={styles.sigBox}>
                  <div className={styles.sigLine} />
                  <p className={styles.sigLabel}>Class Teacher</p>
                </div>
                <div className={styles.dateBox}>
                  <p className={styles.dateVal}>{date}</p>
                  <p className={styles.dateLabel}>Date of Completion</p>
                </div>
                <div className={styles.sigBox}>
                  <div className={styles.sigLine} />
                  <p className={styles.sigLabel}>Principal</p>
                </div>
              </div>

              <div className={styles.bottomDeco}>
                <span>✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <p className={styles.hint}>The image will always be the same size regardless of your device</p>
    </div>
  )
}

export default function PracticeCertificatePage() {
  return (
    <Suspense fallback={<div className="page" style={{ color: 'var(--text2)' }}>Loading…</div>}>
      <CertContent />
    </Suspense>
  )
}
