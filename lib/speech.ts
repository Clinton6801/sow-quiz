/**
 * Speaks a spelling bee word clearly.
 * - Short words (≤3 letters): spells each letter with pauses, repeats twice
 * - Normal words: speaks at slow rate
 * - Always cancels any ongoing speech first
 */
export function speakWord(word: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const clean = word.trim()
  const isShort = clean.length <= 3

  // For short words, space out each letter so browser pronounces them individually
  const spokenText = isShort ? clean.split('').join('... ') : clean

  const speak = (delay = 0) => {
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(spokenText)
      u.rate   = isShort ? 0.45 : 0.72
      u.pitch  = 1
      u.volume = 1
      window.speechSynthesis.speak(u)
    }, delay)
  }

  speak(0)
  // Repeat short words after a pause so students hear it twice
  if (isShort) speak(1400)
}