import type { IBoardGame } from '@/lib/board'

export type MatchId = 'semi1' | 'semi2' | 'qualifier' | 'grand'
export interface PlayoffBracket {
  finalist: string | null
  seeds: [string | null, string | null, string | null, string | null]
  winners: Partial<Record<MatchId, string>>
  games?: Partial<Record<MatchId, string[]>>
}
export interface PlayoffsResponse {
  finalist: string | null
  contenders: string[]
  reason: string | null
  saved: { bracket: PlayoffBracket; revision: number; createdAt: string } | null
  games: Partial<Record<MatchId, IBoardGame[]>>
}
