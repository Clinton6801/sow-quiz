export interface Team {
  name: string
  color: string
}

export type Round = 'round1' | 'round2'

export interface GameState {
  section: string
  round: Round
  pointsPerQ: number
  teams: Team[]
  scores: Record<string, number>
  answeredQs: Record<string, boolean>
  started: boolean
}
