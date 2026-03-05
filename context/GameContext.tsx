'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { GameState, Team, Round } from '../lib/types'

interface GameCtx {
  game: GameState
  startGame: (args: { section: string; round: Round; pointsPerQ: number; teams: Team[] }) => void
  awardPoints: (teamName: string, pts: number) => void
  markAnswered: (qId: string) => void
  setRound: (r: Round) => void
  resetScores: () => void
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
  awardPoints: () => {},
  markAnswered: () => {},
  setRound: () => {},
  resetScores: () => {},
})

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState>(defaultGame)

  const startGame = ({ section, round, pointsPerQ, teams }: {
    section: string; round: Round; pointsPerQ: number; teams: Team[]
  }) => {
    const scores: Record<string, number> = {}
    teams.forEach(t => { scores[t.name] = 0 })
    setGame({ section, round, pointsPerQ, teams, scores, answeredQs: {}, started: true })
  }

  const awardPoints = (teamName: string, pts: number) =>
    setGame(g => ({ ...g, scores: { ...g.scores, [teamName]: (g.scores[teamName] || 0) + pts } }))

  const markAnswered = (qId: string) =>
    setGame(g => ({ ...g, answeredQs: { ...g.answeredQs, [qId]: true } }))

  const setRound = (round: Round) => setGame(g => ({ ...g, round }))

  const resetScores = () =>
    setGame(g => ({
      ...g,
      scores: Object.fromEntries(g.teams.map(t => [t.name, 0])),
      answeredQs: {},
    }))

  return (
    <Ctx.Provider value={{ game, startGame, awardPoints, markAnswered, setRound, resetScores }}>
      {children}
    </Ctx.Provider>
  )
}

export const useGame = () => useContext(Ctx)
