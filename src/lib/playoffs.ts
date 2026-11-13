export type MatchId = 'semi1' | 'semi2' | 'qualifier' | 'grand'
export interface PlayoffBracket {
  finalist: string
  seeds: [string, string, string, string]
  winners: Partial<Record<MatchId, string>>
}
export interface PlayoffsResponse {
  finalist: string | null
  contenders: string[]
  canDraw: boolean
  reason: string | null
  saved: { bracket: PlayoffBracket; revision: number; createdAt: string } | null
}
