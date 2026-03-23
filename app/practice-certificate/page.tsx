'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
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
  const params = useSearchParams()
  const router = useRouter()

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      {/* ── Certificate ── */}
      <div className={styles.cert} id="certificate">
        <div className={styles.outerBorder}>
          <div className={styles.innerBorder}>

            {/* Top decoration */}
            <div className={styles.topDeco}>
              <div className={styles.decoLine} />
              <span className={styles.decoStar}>✦</span>
              <div className={styles.decoLine} />
            </div>

            {/* Header */}
            <div className={styles.certHeader}>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={80} height={80} className={styles.logo} />
              </div>
              <div className={styles.schoolInfo}>
                <p className={styles.schoolName}>Seat of Wisdom Group of Schools</p>
                <p className={styles.schoolTagline}>Excellence · Knowledge · Character</p>
              </div>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={80} height={80} className={styles.logo} />
              </div>
            </div>

            <div className={styles.divider} />

            {/* Title */}
            <p className={styles.certTitle}>Certificate of Achievement</p>
            <p className={styles.certSub}>Practice Quiz — {catIcon} {category}</p>

            {/* Body */}
            <p className={styles.presentedTo}>This certificate is proudly presented to</p>

            <div className={styles.nameBox}>
              <p className={styles.studentName}>{name}</p>
            </div>

            <p className={styles.bodyText}>
              for successfully completing the
            </p>
            <p className={styles.highlight}>
              {catIcon} {category} Practice Quiz
            </p>
            <p className={styles.bodyText}>
              {section && <>— <strong>{section}</strong> —</>}
            </p>

            {/* Score */}
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

            {/* Footer */}
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

            {/* Bottom decoration */}
            <div className={styles.bottomDeco}>
              <span className={styles.decoRow}>✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</span>
            </div>

          </div>
        </div>
      </div>

      <p className={styles.hint}>
        Click "Print / Save as PDF" → in the print dialog, change destination to <strong>Save as PDF</strong>
      </p>
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
