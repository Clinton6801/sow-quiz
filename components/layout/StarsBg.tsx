'use client'
import { useState, useEffect } from 'react'

interface Star {
  id: number
  size: number
  top: number
  left: number
  delay: number
  duration: number
}

export default function StarsBg() {
  const [stars, setStars] = useState<Star[]>([])

  // Only generate stars on the client after mount — fixes hydration mismatch
  useEffect(() => {
    setStars(
      Array.from({ length: 75 }, (_, i) => ({
        id: i,
        size: Math.random() * 2.2 + 0.8,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      }))
    )
  }, [])

  // Render nothing on server / before mount — no hydration mismatch
  if (stars.length === 0) return null

  return (
    <div className="stars">
      {stars.map(s => (
        <span
          key={s.id}
          style={{
            width:             s.size,
            height:            s.size,
            top:               `${s.top}%`,
            left:              `${s.left}%`,
            animationDelay:    `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}