'use client'
import { useState, useEffect } from 'react'
import { getAvailableVoices, savePreferredVoice, getPreferredVoiceName, speakWord } from '@/lib/speech'
import styles from './VoicePicker.module.css'

export default function VoicePicker() {
  const [voices,    setVoices]    = useState<SpeechSynthesisVoice[]>([])
  const [selected,  setSelected]  = useState('')
  const [loading,   setLoading]   = useState(true)
  const [testing,   setTesting]   = useState(false)

  useEffect(() => {
    getAvailableVoices().then(v => {
      // Show English voices first, then others
      const english = v.filter(x => x.lang.startsWith('en'))
      const others  = v.filter(x => !x.lang.startsWith('en'))
      setVoices([...english, ...others])
      setSelected(getPreferredVoiceName() || '')
      setLoading(false)
    })
  }, [])

  const handleChange = (name: string) => {
    setSelected(name)
    savePreferredVoice(name)
  }

  const handleTest = async () => {
    setTesting(true)
    await speakWord('beautiful')
    setTimeout(() => setTesting(false), 3000)
  }

  if (loading) return <p className={styles.loading}>Loading voices…</p>
  if (!voices.length) return <p className={styles.loading}>No voices found on this device.</p>

  const englishVoices = voices.filter(v => v.lang.startsWith('en'))
  const otherVoices   = voices.filter(v => !v.lang.startsWith('en'))

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>🔊 Spelling Bee Voice</p>
          <p className={styles.sub}>Choose the voice used when students hear spelling bee words</p>
        </div>
        <button className={styles.testBtn} onClick={handleTest} disabled={testing}>
          {testing ? '🔊 Playing…' : '▶ Test Voice'}
        </button>
      </div>

      <select
        className={styles.select}
        value={selected}
        onChange={e => handleChange(e.target.value)}
      >
        <option value="">— Auto (best available) —</option>
        {englishVoices.length > 0 && (
          <optgroup label="English Voices (Recommended)">
            {englishVoices.map(v => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </optgroup>
        )}
        {otherVoices.length > 0 && (
          <optgroup label="Other Languages">
            {otherVoices.map(v => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {selected && (
        <p className={styles.saved}>✓ Saved — will use <strong>{selected}</strong></p>
      )}
      {!selected && (
        <p className={styles.saved}>Using auto-selected voice</p>
      )}

      <div className={styles.tip}>
        💡 <strong>Tip:</strong> For best results with short words, choose a <strong>Google</strong> or <strong>Microsoft</strong> English voice if available. Click "Test Voice" to hear how it sounds.
      </div>
    </div>
  )
}
