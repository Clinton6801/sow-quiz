import { supabase } from './supabase'
import { Section, Category } from './questions'

const PRACTICE_LIMIT = 20

export interface PracticeQuestion {
  id: string
  section: Section
  category: Category
  question: string
  answer: string
  hint: string
  created_at: string
}

// ── For students: fetch ALL, shuffle, return random 20 ──
export async function getPracticeQuestions(
  section: Section,
  category: Category
): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)

  if (error) throw error
  if (!data || data.length === 0) return []

  // Fisher-Yates shuffle
  const shuffled = [...data] as PracticeQuestion[]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, PRACTICE_LIMIT)
}

// ── For admin: fetch ALL questions with no limit, ordered by date ──
export async function getAllPracticeQuestions(
  section: Section,
  category: Category
): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as PracticeQuestion[]
}

export async function addPracticeQuestion(q: {
  section: Section
  category: Category
  question: string
  answer: string
  hint?: string
}): Promise<void> {
  const { error } = await supabase
    .from('practice_questions')
    .insert([{ ...q, hint: q.hint ?? '' }])
  if (error) throw error
}

export async function deletePracticeQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('practice_questions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getPracticeCount(section: Section, category: Category): Promise<number> {
  const { count, error } = await supabase
    .from('practice_questions')
    .select('*', { count: 'exact', head: true })
    .eq('section', section)
    .eq('category', category)
  if (error) return 0
  return count ?? 0
}
