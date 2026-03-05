import { supabase } from './supabase'

export type Section  = 'Lower Primary' | 'Upper Primary' | 'Junior Secondary' | 'Senior Secondary'
export type Category = 'Maths' | 'Spelling Bee' | 'General Knowledge'

export interface Question {
  id: string
  section: Section
  category: Category
  question: string
  answer: string
  created_at: string
}

export const SECTIONS: Section[]   = ['Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']
export const CATEGORIES: Category[] = ['Maths', 'Spelling Bee', 'General Knowledge']
export const CATEGORY_ICONS: Record<Category, string> = {
  'Maths':               '📐',
  'Spelling Bee':        '🐝',
  'General Knowledge':   '🌍',
}

export async function getQuestions(section: Section, category: Category): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section', section)
    .eq('category', category)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Question[]
}

export async function getAllForSection(section: Section): Promise<Record<Category, Question[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: true })
  if (error) throw error

  const grouped = {} as Record<Category, Question[]>
  CATEGORIES.forEach(c => { grouped[c] = [] })
  ;(data as Question[]).forEach(q => {
    if (grouped[q.category]) grouped[q.category].push(q)
  })
  return grouped
}

export async function addQuestion(payload: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert([payload])
    .select()
  if (error) throw error
  return (data as Question[])[0]
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}
