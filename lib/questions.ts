import { supabase } from './supabase'

export const SECTIONS = [
  'Little Sprouts',
  'Rising Explorers',
  'Builders League',
  'Champions Circle',
  'Elite Masters',
  'Grand Legends',
] as const

export type Section = typeof SECTIONS[number]

export const CATEGORIES = ['Maths', 'Spelling Bee', 'General Knowledge'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_ICONS: Record<Category, string> = {
  'Maths':             '📐',
  'Spelling Bee':      '🐝',
  'General Knowledge': '🌍',
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
