import { supabase } from './supabase'

export interface LeaderboardEntry {
  id: string
  team_name: string
  section: string
  score: number
  wins: number
  created_at: string
}

export async function getLeaderboard(section?: string): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
  if (section && section !== 'All') query = query.eq('section', section)
  const { data, error } = await query
  if (error) throw error
  return data as LeaderboardEntry[]
}

export async function upsertScore(args: {
  teamName: string
  section: string
  addScore: number
  addWin: boolean
}): Promise<void> {
  const { teamName, section, addScore, addWin } = args

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('team_name', teamName)
    .eq('section', section)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('leaderboard')
      .update({ score: existing.score + addScore, wins: existing.wins + (addWin ? 1 : 0) })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('leaderboard')
      .insert([{ team_name: teamName, section, score: addScore, wins: addWin ? 1 : 0 }])
  }
}

export async function resetLeaderboard(section?: string): Promise<void> {
  let query = supabase.from('leaderboard').delete()
  if (section) {
    query = query.eq('section', section)
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000')
  }
  const { error } = await query
  if (error) throw error
}
