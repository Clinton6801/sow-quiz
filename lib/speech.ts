/**
 * SOW Spelling Bee — Speech Utility
 *
 * Key fixes:
 * 1. Split announcement into TWO separate queued utterances so the TTS engine
 *    doesn't re-process the word the second time (fixes "pronounced then spelled" bug).
 * 2. Wrap the word in a full sentence for the announcement — forces word-level
 *    processing even for rare/long words.
 * 3. The second utterance uses a slower rate so contestants can hear it clearly.
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

// Voices load asynchronously in browsers — wait until they're ready
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }

    const onVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(v)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

    // Fallback — some browsers never fire voiceschanged
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
  if (preferred) {
    const saved = voices.find(v => v.name === preferred)
    if (saved) return saved
  }

  const english = voices.filter(v => v.lang.startsWith('en'))
  const pool = english.length > 0 ? english : voices

  const priorities = [
    (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Female'),
    (v: SpeechSynthesisVoice) => v.name.includes('Google US English'),
    (v: SpeechSynthesisVoice) => v.name.includes('Google'),
    (v: SpeechSynthesisVoice) => v.name.includes('Samantha'),
    (v: SpeechSynthesisVoice) => v.name.includes('Karen'),
    (v: SpeechSynthesisVoice) => v.name.includes('Zira'),
    (v: SpeechSynthesisVoice) => v.name.includes('Hazel'),
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female'),
  ]

  for (const check of priorities) {
    const match = pool.find(check)
    if (match) return match
  }

  return pool[0]
}

/**
 * Build a SpeechSynthesisUtterance with the chosen voice applied.
 */
function makeUtterance(
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  pitch = 1,
  volume = 1
): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text)
  if (voice) u.voice = voice
  u.lang   = voice?.lang ?? 'en-GB'
  u.rate   = rate
  u.pitch  = pitch
  u.volume = volume
  return u
}

/**
 * Speaks a spelling bee word as TWO separate queued utterances:
 *
 *   Utterance 1 (rate 0.82): "Your word is: [word]."
 *   Utterance 2 (rate 0.65): "[word]."
 *
 * Using two utterances prevents the TTS engine from re-processing the word
 * the second time, which is what causes the "pronounced then spelled" bug.
 * The sentence context in utterance 1 forces word-level pronunciation even
 * for rare or long words like "abstemious".
 */
export async function speakWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const clean = word.trim()
  const voice = await pickVoice()

  setTimeout(() => {
    // Utterance 1 — announcement with sentence context
    const u1 = makeUtterance(`Your word is: ${clean}.`, voice, 0.82)

    // Utterance 2 — word repeated slowly and clearly, standalone
    const u2 = makeUtterance(clean, voice, 0.65)

    window.speechSynthesis.speak(u1)
    window.speechSynthesis.speak(u2)
  }, 120)
}

/**
 * Repeats the word twice using two separate utterances.
 * Used for the "Hear Again" / "Repeat" button.
 */
export async function repeatWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const clean = word.trim()
  const voice = await pickVoice()

  setTimeout(() => {
    const u1 = makeUtterance(clean, voice, 0.65)
    const u2 = makeUtterance(clean, voice, 0.65)

    window.speechSynthesis.speak(u1)
    window.speechSynthesis.speak(u2)
  }, 120)
}
