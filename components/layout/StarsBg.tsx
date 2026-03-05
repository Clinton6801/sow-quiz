'use client'
import { useMemo } from 'react'

export default function StarsBg() {
  const stars = useMemo(() =>
    Array.from({ length: 75 }, (_, i) => ({
      id: i,
      size: Math.random() * 2.2 + 0.8,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })), []
  )

  return (
    <div className="stars">
      {stars.map(s => (
        <span key={s.id} style={{
          width:  s.size,
          height: s.size,
          top:    `${s.top}%`,
          left:   `${s.left}%`,
          animationDelay:    `${s.delay}s`,
          animationDuration: `${s.duration}s`,
        }} />
      ))}
    </div>
  )
}
