'use client'
import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

function CertContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const certRef = useRef<HTMLDivElement>(null)

  const winner   = params.get('winner')   ?? 'Champion'
  const score    = params.get('score')    ?? '0'
  const section  = params.get('section')  ?? ''
  const category = params.get('category') ?? 'Quiz Championship'
  const date     = params.get('date')     ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handlePrint = () => window.print()

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={handlePrint}>🖨 Print / Save PDF</button>
      </div>

      {/* Certificate — this is what gets printed */}
      <div className={styles.cert} ref={certRef} id="certificate">
        {/* Decorative border */}
        <div className={styles.outerBorder}>
          <div className={styles.innerBorder}>

            {/* Header */}
            <div className={styles.certHeader}>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={90} height={90} className={styles.logo} />
              </div>
              <div className={styles.schoolInfo}>
                <p className={styles.schoolName}>Seat of Wisdom Group of Schools</p>
                <p className={styles.subTitle}>Quiz Championship</p>
              </div>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={90} height={90} className={styles.logo} />
              </div>
            </div>

            <div className={styles.divLine} />

            {/* Body */}
            <p className={styles.certOfAchievement}>Certificate of Achievement</p>
            <p className={styles.thisIs}>This is to certify that</p>

            <div className={styles.winnerBox}>
              <p className={styles.winnerName}>{winner}</p>
            </div>

            <p className={styles.bodyText}>
              has demonstrated outstanding knowledge and achieved
            </p>

            <div className={styles.scoreBox}>
              <span className={styles.scoreNum}>{score}</span>
              <span className={styles.scoreLabel}>points</span>
            </div>

            <p className={styles.bodyText}>
              in the <strong>{category}</strong> category
              {section ? <> — <strong>{section}</strong></> : ''} Quiz Competition
            </p>

            <div className={styles.divLine} />

            {/* Footer */}
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

            {/* Stars decoration */}
            <div className={styles.stars}>
              {'⭐'.repeat(5)}
            </div>

          </div>
        </div>
      </div>

      <p className={styles.hint}>Tip: Click "Print / Save PDF" → Change destination to "Save as PDF" in the print dialog</p>
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
