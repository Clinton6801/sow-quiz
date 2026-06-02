import { supabase } from './supabase'

/**
 * Spelling game utilities.
 *
 * maskWord("ANIMAL")   → "A_I_AL"
 * maskWord("ELEPHANT") → "E_E_H_NT"
 *
 * Rules:
 * - First and last letter always visible
 * - Every alternate letter in between is hidden with "_"
 * - Word is uppercased for display
 */

export function maskWord(word: string): string {
  const upper = word.toUpperCase()
  if (upper.length <= 2) return upper

  const chars = upper.split('')
  const masked = chars.map((char, i) => {
    if (i === 0 || i === chars.length - 1) return char
    return i % 2 === 1 ? '_' : char
  })

  return masked.join('')
}

/**
 * Returns the masked word as an array of characters for display.
 * "_" entries are rendered as underline blanks.
 */
export function maskWordChars(word: string): string[] {
  return maskWord(word).split('')
}

/**
 * Normalises an answer for comparison — trim + lowercase.
 */
export function normaliseAnswer(answer: string): string {
  return answer.trim().toLowerCase()
}

/**
 * Returns the streak multiplier for a given streak count.
 * 1 correct = 1×, 2 = 1.5×, 3 = 2×, 4 = 2.5×, 5+ = 3×
 */
export function streakMultiplier(streak: number): number {
  if (streak <= 1) return 1
  if (streak === 2) return 1.5
  if (streak === 3) return 2
  if (streak === 4) return 2.5
  return 3
}

/**
 * Calculates points for a correct answer given the current streak.
 * Base: 10 pts × multiplier, rounded to nearest integer.
 */
export function calcPoints(streak: number): number {
  return Math.round(10 * streakMultiplier(streak))
}

export interface SpellingWord {
  id: string
  word: string
  section: string
  hint: string | null
  audio_url: string | null
  created_at: string
}

/**
 * Get all spelling words for a section.
 * Includes audio_url so teacher recordings can be played at game time.
 */
export async function getSpellingWords(section: string): Promise<SpellingWord[]> {
  const { data, error } = await supabase
    .from('spelling_words')
    .select('id, word, section, hint, audio_url, created_at')
    .eq('section', section)
    .order('word', { ascending: true })

  if (error) throw error
  return (data as SpellingWord[]) || []
}

/**
 * Get spelling words grouped by section.
 * Includes audio_url for playback at game time.
 */
export async function getWordsBySection(section: string): Promise<Record<string, SpellingWord[]>> {
  const { data, error } = await supabase
    .from('spelling_words')
    .select('id, word, section, hint, audio_url, created_at')
    .eq('section', section)
    .order('word', { ascending: true })

  if (error) throw error

  const grouped: Record<string, SpellingWord[]> = {}
  for (const w of (data as SpellingWord[])) {
    if (!grouped[w.section]) grouped[w.section] = []
    grouped[w.section].push(w)
  }
  return grouped
}
