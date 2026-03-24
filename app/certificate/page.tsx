'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

const POSITION_COLORS: Record<string, string> = {
  '1st Place': '#FFD700',
  '2nd Place': '#C0C0C0',
  '3rd Place': '#CD7F32',
}
const POSITION_MEDALS: Record<string, string> = {
  '1st Place': '🥇', '2nd Place': '🥈', '3rd Place': '🥉',
}

function CertContent() {
  const params  = useSearchParams()
  const router  = useRouter()

  const winner   = params.get('winner')   ?? 'Champion'
  const score    = params.get('score')    ?? '0'
  const section  = params.get('section')  ?? ''
  const category = params.get('category') ?? 'Quiz Championship'
  const position = params.get('position') ?? ''
  const date     = params.get('date')     ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const posColor  = POSITION_COLORS[position] ?? '#003580'
  const posMedal  = POSITION_MEDALS[position] ?? '🏅'

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>

      <div className={styles.cert} id="certificate">
        <div className={styles.outerBorder}>
          <div className={styles.innerBorder}>

            {/* Top deco */}
            <div className={styles.topDeco}>
              <div className={styles.decoLine} />
              <span className={styles.decoStar}>✦</span>
              <div className={styles.decoLine} />
            </div>

            {/* Header */}
            <div className={styles.certHeader}>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={90} height={90} className={styles.logo} />
              </div>
              <div className={styles.schoolInfo}>
                <p className={styles.schoolName}>Seat of Wisdom Group of Schools</p>
                <p className={styles.schoolTagline}>Excellence · Knowledge · Character</p>
              </div>
              <div className={styles.logoWrap}>
                <Image src="/logo.jpeg" alt="SOW" width={90} height={90} className={styles.logo} />
              </div>
            </div>

            <div className={styles.divLine} />

            <p className={styles.certOfAchievement}>Certificate of Achievement</p>
            <p className={styles.certSub}>{category}{section ? ` — ${section}` : ''}</p>

            <p className={styles.thisIs}>This is to certify that</p>

            <div className={styles.winnerBox}>
              <p className={styles.winnerName}>{winner}</p>
            </div>

            {/* Position badge */}
            {position && (
              <div className={styles.positionBadge} style={{ borderColor: posColor, background: `${posColor}18` }}>
                <span className={styles.positionMedal}>{posMedal}</span>
                <span className={styles.positionText} style={{ color: posColor }}>{position}</span>
              </div>
            )}

            <p className={styles.bodyText}>
              has demonstrated outstanding knowledge and achieved
            </p>

            <div className={styles.scoreBox}>
              <span className={styles.scoreNum}>{score}</span>
              <span className={styles.scoreLabel}>points</span>
            </div>

            <p className={styles.bodyText}>
              in the <strong>{category}</strong> Quiz Competition
            </p>

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

            <div className={styles.bottomDeco}>
              <span>✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦ &nbsp; ✦</span>
            </div>

          </div>
        </div>
      </div>

      <p className={styles.hint}>Tip: "Print / Save PDF" → change destination to <strong>Save as PDF</strong></p>
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
