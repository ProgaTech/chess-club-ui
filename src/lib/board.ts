export type GameOutcome = 'white' | 'black' | 'draw' | 'unknown'
export type MatchStatus = 'open' | 'playing' | 'played' | 'split' | 'bye' | 'skipped'

export interface IBoardGame {
  url: string
  outcome: GameOutcome
  winnerName: string | null
  winnerColor: 'white' | 'black' | null
  summary: string | null
  playedAt: string | null
  moveList: string | null
  opening: string | null
}

export interface IBoardPair {
  white: string
  black: string | null
  across: boolean
  games: IBoardGame[]
  whiteGameWins: number
  blackGameWins: number
  status: MatchStatus
  winner: string | null
  whitePoints: number
  blackPoints: number
}

export interface IBoardDraw {
  id: number
  createdAt: string
  round: number
  pairs: IBoardPair[]
}

export interface IStanding {
  name: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  gameWins: number
}

export interface IRecordMark {
  names: string[]
  playedAt: string | null
  url: string | null
  moves: number | null
  games: number | null
  deficit: number | null
  opponent: string | null
  current: boolean
}

export interface IAchievements {
  firstGame: IRecordMark[]
  quickestWin: IRecordMark[]
  longestGame: IRecordMark[]
  mostGames: IRecordMark[]
  recovery: IRecordMark[]
  tournament: IRecordMark[]
}

export interface IOpeningCount {
  name: string
  games: number
  whiteWins: number
  blackWins: number
  draws: number
}

export interface IClubStats {
  members: number
  games: number
  whiteWins: number
  blackWins: number
  draws: number
  openings: IOpeningCount[]
}

export interface IClubGameRow {
  url: string
  white: string
  black: string
  outcome: GameOutcome
  winnerName: string | null
  playedAt: string | null
  opening: string | null
  round: number
}

export interface IGameStanding {
  name: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  elo: number
}

export interface IClubBoard {
  draws: IBoardDraw[]
  standings: IStanding[]
  achievements?: IAchievements
  stats?: IClubStats
  games?: IClubGameRow[]
  gameStandings?: IGameStanding[]
}

export interface ISignupPlayer {
  name: string
  chessCom: string | null
  claimed: boolean
  mine: boolean
}

export interface IAddMatchGame {
  white: string
  black: string
  url: string
}

export function isClubBoard(value: unknown): value is IClubBoard {
  if (!isRecord(value)) {
    return false
  }
  return Array.isArray(value.draws) && Array.isArray(value.standings)
}

export function pointLabel(points: number): string {
  const shown = Number.isInteger(points) ? String(points) : points.toFixed(1)
  return shown === '1' ? '1 pt' : `${shown} pts`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
