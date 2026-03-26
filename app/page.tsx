import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'

const SECTIONS = [
  { name: 'Little Sprouts',    grades: 'Sprout 1–2',              icon: '🌱' },
  { name: 'Rising Explorers',  grades: 'Stepping Stone – Grade 1', icon: '🌿' },
  { name: 'Builders League',   grades: 'Grade 2–3',               icon: '🌳' },
  { name: 'Champions Circle',  grades: 'Grade 4–5',               icon: '🌟' },
  { name: 'Elite Masters',     grades: 'Grade 7–9 (JSS 1–3)',     icon: '🧠' },
  { name: 'Grand Legends',     grades: 'Grade 10–11 (SSS 1–2)',   icon: '👑' },
]

export default function HomePage() {
  return (
    <div className={styles.hero}>
      {/* School identity */}
      <div className={styles.identity}>
        <Image src="/logo.jpeg" alt="Seat of Wisdom Group of Schools"
          width={120} height={120} className={styles.logo} priority />
        <div className={styles.identityText}>
          <h1 className={styles.school1}>Seat of Wisdom</h1>
          <h2 className={styles.school2}>Group of Schools</h2>
          <p className={styles.motto}>Education — The Best Legacy</p>
        </div>
      </div>

      <div className={styles.divider} />

      <p className={styles.appTitle}>Quiz Championship</p>
      <p className={styles.cats}>📐 Maths &nbsp;·&nbsp; 🐝 Spelling Bee &nbsp;·&nbsp; 🌍 General Knowledge</p>

      <div className={styles.grid}>
        {SECTIONS.map(s => (
          <Link key={s.name} href={`/setup?section=${encodeURIComponent(s.name)}`} className={styles.card}>
            <span className={styles.cardIcon}>{s.icon}</span>
            <span className={styles.cardName}>{s.name}</span>
            <span className={styles.cardGrades}>{s.grades}</span>
          </Link>
        ))}
      </div>

      <div className={styles.cta}>
        <Link href="/setup" className="btn btn-primary btn-lg">🚀 Start Quiz</Link>
        <Link href="/leaderboard" className="btn btn-ghost">🏆 Leaderboard</Link>
      </div>
    </div>
  )
}
