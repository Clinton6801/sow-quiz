import { supabase } from './supabase'

export type RoomStatus = 'waiting' | 'question' | 'buzzed' | 'revealed' | 'ended'

export interface Room {
  id: string
  code: string
  host_id: string
  section: string
  status: RoomStatus
  current_q: QuestionPayload | null
  buzzed_by: string | null
  timer_seconds: number
  timer_started_at: string | null
  double_points: boolean
  pts_per_q: number
  categories: string[]
  created_at: string
}

export interface QuestionPayload {
  id: string
  question: string
  answer: string
  category: string
}

export interface Contestant {
  id: string
  room_code: string
  name: string
  team_color: string
  score: number
  locked_q_id: string
  joined_at: string
}

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SOW-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createRoom(hostId: string, opts: {
  section: string; ptsPerQ: number; timerSeconds: number; categories: string[]
}): Promise<Room> {
  const code = generateCode()
  const { data, error } = await supabase
    .from('rooms')
    .insert([{ code, host_id: hostId, section: opts.section, status: 'waiting',
      pts_per_q: opts.ptsPerQ, timer_seconds: opts.timerSeconds,
      categories: opts.categories, double_points: false }])
    .select().single()
  if (error) throw error
  return data as Room
}

export async function getRoom(code: string): Promise<Room | null> {
  const { data, error } = await supabase.from('rooms').select('*')
    .eq('code', code.toUpperCase()).single()
  if (error) return null
  return data as Room
}

export async function updateRoom(code: string, patch: Partial<Room>): Promise<void> {
  const { error } = await supabase.from('rooms').update(patch).eq('code', code)
  if (error) throw error
}

export async function joinRoom(roomCode: string, name: string, teamColor: string): Promise<Contestant> {
  const { data, error } = await supabase.from('contestants')
    .insert([{ room_code: roomCode.toUpperCase(), name, team_color: teamColor, locked_q_id: '' }])
    .select().single()
  if (error) throw error
  return data as Contestant
}

export async function getContestants(roomCode: string): Promise<Contestant[]> {
  const { data, error } = await supabase.from('contestants').select('*')
    .eq('room_code', roomCode).order('score', { ascending: false })
  if (error) throw error
  return data as Contestant[]
}

export async function awardContestant(contestantId: string, pts: number): Promise<void> {
  const { data: c } = await supabase.from('contestants').select('score').eq('id', contestantId).single()
  if (!c) return
  await supabase.from('contestants').update({ score: c.score + pts }).eq('id', contestantId)
}

export async function lockContestant(contestantId: string, questionId: string): Promise<void> {
  await supabase.from('contestants').update({ locked_q_id: questionId }).eq('id', contestantId)
}

export async function deleteRoom(code: string): Promise<void> {
  await supabase.from('rooms').delete().eq('code', code)
}

export function subscribeToRoom(code: string, callback: (room: Room) => void) {
  return supabase.channel(`room:${code}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms',
      filter: `code=eq.${code}` }, payload => callback(payload.new as Room))
    .subscribe()
}

export function subscribeToContestants(code: string, callback: (contestants: Contestant[]) => void) {
  return supabase.channel(`contestants:${code}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contestants',
      filter: `room_code=eq.${code}` }, async () => {
      callback(await getContestants(code))
    }).subscribe()
}
