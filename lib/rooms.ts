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
  joined_at: string
}

// ── Generate a short room code like SOW-4F2 ──
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'SOW-'
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Create a new room ──
export async function createRoom(hostId: string, section: string): Promise<Room> {
  const code = generateCode()
  const { data, error } = await supabase
    .from('rooms')
    .insert([{ code, host_id: hostId, section, status: 'waiting' }])
    .select()
    .single()
  if (error) throw error
  return data as Room
}

// ── Get room by code ──
export async function getRoom(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (error) return null
  return data as Room
}

// ── Update room state (host only) ──
export async function updateRoom(code: string, patch: Partial<Room>): Promise<void> {
  const { error } = await supabase.from('rooms').update(patch).eq('code', code)
  if (error) throw error
}

// ── Join room as contestant ──
export async function joinRoom(roomCode: string, name: string, teamColor: string): Promise<Contestant> {
  const { data, error } = await supabase
    .from('contestants')
    .insert([{ room_code: roomCode.toUpperCase(), name, team_color: teamColor }])
    .select()
    .single()
  if (error) throw error
  return data as Contestant
}

// ── Get all contestants in a room ──
export async function getContestants(roomCode: string): Promise<Contestant[]> {
  const { data, error } = await supabase
    .from('contestants')
    .select('*')
    .eq('room_code', roomCode)
    .order('score', { ascending: false })
  if (error) throw error
  return data as Contestant[]
}

// ── Award points to contestant ──
export async function awardContestant(contestantId: string, pts: number): Promise<void> {
  const { data: c } = await supabase.from('contestants').select('score').eq('id', contestantId).single()
  if (!c) return
  await supabase.from('contestants').update({ score: c.score + pts }).eq('id', contestantId)
}

// ── Delete room ──
export async function deleteRoom(code: string): Promise<void> {
  await supabase.from('rooms').delete().eq('code', code)
}

// ── Subscribe to room changes (Realtime) ──
export function subscribeToRoom(code: string, callback: (room: Room) => void) {
  return supabase
    .channel(`room:${code}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `code=eq.${code}`,
    }, payload => callback(payload.new as Room))
    .subscribe()
}

// ── Subscribe to contestant changes (Realtime) ──
export function subscribeToContestants(code: string, callback: (contestants: Contestant[]) => void) {
  return supabase
    .channel(`contestants:${code}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'contestants',
      filter: `room_code=eq.${code}`,
    }, async () => {
      const updated = await getContestants(code)
      callback(updated)
    })
    .subscribe()
}
