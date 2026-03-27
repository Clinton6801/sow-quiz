/**
 * SOW Spelling Bee — Speech Utility
 * Option A: Wraps word in announcement sentence (fixes short word pronunciation)
 * Option B: Voice picker with localStorage preference
 */

const VOICE_KEY = 'sow-spelling-voice'

export function savePreferredVoice(voiceName: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(VOICE_KEY, voiceName)
}

export function getPreferredVoiceName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(VOICE_KEY) ?? ''
}

// Voices load asynchronously in browsers — this waits until they're ready
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }

    // Voices not loaded yet — wait for the event
    const onVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(v)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

    // Fallback timeout in case event never fires (some browsers)
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }, 1500)
  })
}

export async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return waitForVoices()
}

async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await waitForVoices()
  if (!voices.length) return null

  const preferred = getPreferredVoiceName()

  // Use saved preference if it's still available on this device
  if (preferred) {
    const saved = voices.find(v => v.name === preferred)
    if (saved) return saved
  }

  // Auto-pick: English voices only
  const english = voices.filter(v => v.lang.startsWith('en'))
  const pool = english.length > 0 ? english : voices

  // Priority order — clearest voices for spelling
  const priorities = [
    (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Female'),
    (v: SpeechSynthesisVoice) => v.name.includes('Google US English'),
    (v: SpeechSynthesisVoice) => v.name.includes('Google'),
    (v: SpeechSynthesisVoice) => v.name.includes('Samantha'),   // macOS/iOS
    (v: SpeechSynthesisVoice) => v.name.includes('Karen'),      // macOS
    (v: SpeechSynthesisVoice) => v.name.includes('Zira'),       // Windows female
    (v: SpeechSynthesisVoice) => v.name.includes('Hazel'),      // Windows UK
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female'),
  ]

  for (const check of priorities) {
    const match = pool.find(check)
    if (match) return match
  }

  return pool[0]
}

/**
 * Speaks a spelling bee word using the announcement format:
 * "Your word is... [word]. [word]."
 *
 * The sentence context forces the TTS engine to treat
 * even 1-2 letter words as real words, not abbreviations.
 */
export async function speakWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const clean = word.trim()
  const voice = await pickVoice()

  // Delay slightly — cancel() needs a moment to fully stop
  setTimeout(() => {
    // Option A: sentence wrapping fixes short word pronunciation
    const announcement = `Your word is... ${clean}. ... ${clean}.`

    const u = new SpeechSynthesisUtterance(announcement)
    if (voice) u.voice = voice
    u.lang   = voice?.lang ?? 'en-GB'
    u.rate   = 0.78
    u.pitch  = 1
    u.volume = 1

    window.speechSynthesis.speak(u)
  }, 100)
}

/**
 * Repeats just the word twice — no announcement prefix.
 * Used for a "hear again" button.
 */
export async function repeatWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const clean = word.trim()
  const voice = await pickVoice()

  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(`${clean}. ... ${clean}.`)
    if (voice) u.voice = voice
    u.lang   = voice?.lang ?? 'en-GB'
    u.rate   = 0.68
    u.pitch  = 1
    u.volume = 1
    window.speechSynthesis.speak(u)
  }, 100)
}
