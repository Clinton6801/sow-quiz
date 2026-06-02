'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { GameState, Team, Round } from '../lib/types'

interface GameCtx {
  game: GameState
  startGame: (args: { section: string; round: Round; pointsPerQ: number; teams: Team[] }) => void
  awardPoints: (teamName: string, pts: number, qId?: string) => void
  adjustPoints: (teamName: string, pts: number) => void
  markAnswered: (qId: string) => void
  setRound: (r: Round) => void
  resetScores: () => void
  lastAward: LastAward | null
  undoLastAward: () => void
  showHints: boolean
  setShowHints: (show: boolean) => void
}

export interface LastAward {
  teamName: string
  pts: number
  qId: string
}

const defaultGame: GameState = {
  section: 'Lower Primary',
  round: 'round1',
  pointsPerQ: 10,
  teams: [
    { name: 'Team Red',  color: '#C8102E' },
    { name: 'Team Blue', color: '#003580' },
    { name: 'Team Gold', color: '#B8860B' },
  ],
  scores: {},
  answeredQs: {},
  started: false,
}

const Ctx = createContext<GameCtx>({
  game: defaultGame,
  startGame: () => {},
  awardPoints: (_t: string, _p: number, _q?: string) => {},
  adjustPoints: () => {},
  markAnswered: () => {},
  setRound: () => {},
  resetScores: () => {},
  lastAward: null,
  undoLastAward: () => {},
  showHints: false,
  setShowHints: () => {},
})

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(defaultGame)
  const [lastAward, setLastAward] = useState<LastAward | null>(null)
  const [showHints, setShowHints] = useState(false)

  const startGame = ({ section, round, pointsPerQ, teams }: {
    section: string; round: Round; pointsPerQ: number; teams: Team[]
  }) => {
    const scores: Record<string, number> = {}
    teams.forEach(t => { scores[t.name] = 0 })
    setGame({ section, round, pointsPerQ, teams, scores, answeredQs: {}, started: true })
    setLastAward(null)
    setShowHints(false)
  }

  const awardPoints = (teamName: string, pts: number, qId?: string) => {
    setGame(g => ({ ...g, scores: { ...g.scores, [teamName]: (g.scores[teamName] || 0) + pts } }))
    if (qId) setLastAward({ teamName, pts, qId })
  }

  const adjustPoints = (teamName: string, pts: number) =>
    setGame(g => ({
      ...g,
      scores: { ...g.scores, [teamName]: Math.max(0, (g.scores[teamName] || 0) + pts) }
    }))

  const undoLastAward = () => {
    if (!lastAward) return
    setGame(g => ({
      ...g,
      scores: { ...g.scores, [lastAward.teamName]: Math.max(0, (g.scores[lastAward.teamName] || 0) - lastAward.pts) },
      answeredQs: Object.fromEntries(Object.entries(g.answeredQs).filter(([k]) => k !== lastAward.qId)),
    }))
    setLastAward(null)
  }

  const markAnswered = (qId: string) =>
    setGame(g => ({ ...g, answeredQs: { ...g.answeredQs, [qId]: true } }))

  const setRound = (round: Round) => setGame(g => ({ ...g, round }))

  const resetScores = () => {
    setGame(g => ({
      ...g,
      scores: Object.fromEntries(g.teams.map(t => [t.name, 0])),
      answeredQs: {},
    }))
    setLastAward(null)
  }

  return (
    <Ctx.Provider value={{ game, startGame, awardPoints, adjustPoints, markAnswered, setRound, resetScores, lastAward, undoLastAward, showHints, setShowHints }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGame = () => useContext(Ctx)
