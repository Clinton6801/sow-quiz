import { supabase } from './supabase'

// ── Single unified set of sections (matches the home page cards) ──
export const SECTIONS = [
  'Sprout 2/3',
  'Stepping Stone & Grade 1',
  'Grade 2/3',
  'Grade 4/5',
  'JSS 1–3',
  'SS 1–2',
] as const

export type Section = typeof SECTIONS[number]

// ── Section metadata (for display) ──
export const SECTION_META: Record<Section, { label: string; sub: string; icon: string }> = {
  'Sprout 2/3':                { label: 'Sprout',          sub: 'Sprout 2/3',               icon: '🌱' },
  'Stepping Stone & Grade 1':  { label: 'Stepping Stone',  sub: 'Stepping Stone & Grade 1', icon: '🪴' },
  'Grade 2/3':                 { label: 'Grade 2/3',       sub: 'Grade 2/3',                icon: '📗' },
  'Grade 4/5':                 { label: 'Grade 4/5',       sub: 'Grade 4/5',                icon: '📘' },
  'JSS 1–3':                   { label: 'JSS 1–3',         sub: 'JSS 1–3',                  icon: '🎓' },
  'SS 1–2':                    { label: 'SS 1–2',          sub: 'SS 1–2',                   icon: '🏫' },
}

// ── Categories ──
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
