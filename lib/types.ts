export interface Team {
  name: string
  color: string
  photo?: string   // base64 data URL — captured or uploaded on setup page
}

export type Round = 'round1' | 'round2' | 'round3'

export interface Question {
  id: string
  section: string
  category: string
  question: string
  answer: string
  difficulty?: string
  hint?: string
  created_at: string
}

export interface GameState {
  section: string
  round: Round
  pointsPerQ: number
  teams: Team[]
  scores: Record<string, number>
  answeredQs: Record<string, boolean>
  started: boolean
  gauntletParticipants?: number
  gauntletCategory?: string
  gauntletStage?: 'easy' | 'moderate' | 'hard' | 'champion'
  showHint?: boolean  // For multiplayer hint toggle
  gauntletStageStats?: Record<'easy' | 'moderate' | 'hard' | 'champion', { attempted: number; correct: number; points: number }>
}
