import { supabase } from './supabase'

// ── Standard quiz sections ──
export const QUIZ_SECTIONS = [
  'Lower Primary',
  'Upper Primary',
  'Junior Secondary',
  'Senior Secondary',
] as const
export type QuizSection = typeof QUIZ_SECTIONS[number]

// ── Spelling Bee age categories ──
export const SPELLING_SECTIONS = [
  'Little Word Sprouts',       // Ages 3–4  (Sprout 2/3)
  'Rising Word Explorers',     // Ages 5–6  (Stepping Stone & Grade 1)
  'Word Builders League',      // Ages 7–8  (Grade 2/3)
  'Word Champions Circle',     // Ages 9–10 (Grade 4/5)
  'Elite Word Masters',        // Ages 11–13 (JSS 1–3)
  'Grand Spelling Legends',    // Ages 14–15 (SSS 1–2)
] as const
export type SpellingSection = typeof SPELLING_SECTIONS[number]

// ── All sections combined ──
export const SECTIONS = [...QUIZ_SECTIONS, ...SPELLING_SECTIONS] as const
export type Section = typeof SECTIONS[number]

// ── Categories ──
export const CATEGORIES = ['Maths', 'Spelling Bee', 'General Knowledge'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_ICONS: Record<Category, string> = {
  'Maths':             '📐',
  'Spelling Bee':      '🐝',
  'General Knowledge': '🌍',
}

// ── Spelling section metadata ──
export const SPELLING_SECTION_META: Record<SpellingSection, { ages: string; grades: string }> = {
  'Little Word Sprouts':    { ages: 'Ages 3–4',  grades: 'Sprout 2/3' },
  'Rising Word Explorers':  { ages: 'Ages 5–6',  grades: 'Stepping Stone & Grade 1' },
  'Word Builders League':   { ages: 'Ages 7–8',  grades: 'Grade 2/3' },
  'Word Champions Circle':  { ages: 'Ages 9–10', grades: 'Grade 4/5' },
  'Elite Word Masters':     { ages: 'Ages 11–13', grades: 'JSS 1–3' },
  'Grand Spelling Legends': { ages: 'Ages 14–15', grades: 'SSS 1–2' },
}

export interface Question {
  id: string
  section: string
  category: Category
  question: string
  answer: string
  created_at: string
}

export async function getQuestions(section: string, category: Category): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Question[]
}

export async function getAllForSection(section: string): Promise<Record<string, Question[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: true })
  if (error) throw error
  const grouped: Record<string, Question[]> = {}
  for (const q of (data as Question[])) {
    if (!grouped[q.category]) grouped[q.category] = []
    grouped[q.category].push(q)
  }
  return grouped
}

export async function addQuestion(q: {
  section: string
  category: Category
  question: string
  answer: string
}): Promise<void> {
  const { error } = await supabase.from('questions').insert([q])
  if (error) throw error
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}
