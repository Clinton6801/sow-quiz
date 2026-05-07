/**
 * SOW Spelling Bee — Speech Utility
 *
 * Core principle: speak the word ONCE per utterance, with NO repetition
 * in the same string. Repeating the word (either in one string or across
 * two queued utterances) causes Chrome/Edge TTS to switch to letter-by-letter
 * mode on the second occurrence. One word, one utterance, spoken slowly.
 *
 * The announcement ("Your word is:") provides sentence context so the engine
 * treats the word as a real word rather than an abbreviation — but the word
 * itself only appears once in the utterance.
 *
 * For the "Hear Again" button, we cancel and re-speak a fresh utterance
 * rather than queuing a second one.
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
 * Speak a single utterance with the given voice settings.
 * Always cancels any ongoing speech first.
 */
function speak(
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number
): void {
  window.speechSynthesis.cancel()
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text)
    if (voice) u.voice = voice
    u.lang   = voice?.lang ?? 'en-GB'
    u.rate   = rate
    u.pitch  = 1
    u.volume = 1
    window.speechSynthesis.speak(u)
  }, 120)
}

/**
 * speakWord — used when a new spelling bee question loads or the host
 * clicks "Hear the Word".
 *
 * Speaks: "Your word is: [word]."
 * — The sentence context prevents the engine treating the word as an
 *   abbreviation. The word appears exactly ONCE so it cannot switch to
 *   letter-by-letter mode mid-utterance.
 * — Rate 0.78 is slow enough to be clear without sounding robotic.
 */
export async function speakWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const voice = await pickVoice()
  speak(`Your word is: ${word.trim()}.`, voice, 0.78)
}

/**
 * repeatWord — used for the "Repeat" / "Hear Again" button.
 *
 * Speaks just the word alone at a slower rate.
 * We do NOT queue two utterances — we cancel and speak fresh each time
 * the button is pressed, so the engine always processes it as a new word.
 */
export async function repeatWord(word: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const voice = await pickVoice()
  speak(word.trim(), voice, 0.65)
}
