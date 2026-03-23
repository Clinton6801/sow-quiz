import { supabase } from './supabase'
import { Section, Category } from './questions'

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
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as PracticeQuestion[]
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
