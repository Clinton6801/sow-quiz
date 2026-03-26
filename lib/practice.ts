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

export async function getPracticeQuestions(
  section: Section,
  category: Category
): Promise<PracticeQuestion[]> {
  // Fetch all questions for this section/category
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)

  if (error) throw error
  if (!data || data.length === 0) return []

  // Shuffle using Fisher-Yates
  const shuffled = [...data] as PracticeQuestion[]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Return up to 20 — if fewer than 20 exist, return all of them
  return shuffled.slice(0, PRACTICE_LIMIT)
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