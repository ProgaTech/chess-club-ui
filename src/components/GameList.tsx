import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GameBoard } from '@/components/GameBoard'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

export interface IClubGame {
  analysisGameId?: string | null
  url: string
  opponent: string
  color: 'white' | 'black'
  outcome: 'win' | 'loss' | 'draw' | 'unknown'
  summary: string
  white: string
  black: string
  whiteRating: number | null
  blackRating: number | null
  whiteChange: number | null
  blackChange: number | null
  timeControl: string | null
  opening: string | null
  playedAt: string | null
  moveList: string | null
  yours: boolean
}

interface IGameListProps {
  games: IClubGame[]
  voice: 'you' | 'player'
}

interface IGameRowProps {
  game: IClubGame
  voice: 'you' | 'player'
}

export function GameList(props: IGameListProps) {
  const { games, voice } = props

  return (
    <div className="mt-4">
      {games.map((game) => (
        <GameRow game={game} key={`${game.url}-${game.opponent}`} voice={voice} />
      ))}
    </div>
  )
}

function GameRow(props: IGameRowProps) {
  const { game, voice } = props
  const [open, setOpen] = useState(false)
  const details = [game.timeControl, game.opening, formatPlayedAt(game.playedAt)].filter(Boolean)
  const colorNote = game.yours ? (voice === 'you' ? `you had ${game.color}` : `played ${game.color}`) : null

  const body = (
    <>
      <p className="text-lg font-bold">
        <span className={cn(game.yours && game.outcome === 'loss' && 'text-secondary')}>{game.summary}</span>
        <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
        <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(game.opponent)}>
          {game.opponent}
        </Link>
      </p>
      {voice === 'you' && game.analysisGameId && <Link className="mt-2 inline-block text-sm underline" to={'/analysis?game=' + encodeURIComponent(game.analysisGameId)}>Analyze game</Link>}
      {colorNote ? <p className="mt-2 text-sm text-muted-foreground">{colorNote}</p> : null}
      {details.length > 0 ? <p className="mt-1 text-sm text-muted-foreground">{details.join(' · ')}</p> : null}
      <a
        className="mt-2 inline-block text-sm text-secondary underline underline-offset-4"
        href={game.url}
        rel="noreferrer"
        target="_blank"
      >
        {game.url.replace('https://www.chess.com', 'chess.com')}
      </a>
    </>
  )
  const action = (
    <button
      aria-expanded={open}
      className="text-sm font-bold underline underline-offset-4"
      onClick={() => setOpen((current) => !current)}
      type="button"
    >
      {open ? 'Hide board' : 'Show board'}
    </button>
  )

  return (
    <article className="border-b py-4">
      {open ? (
        <GameBoard action={action} boardId={game.url} details={body} moveList={game.moveList} />
      ) : (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{body}</div>
          {action}
        </div>
      )}
    </article>
  )
}

function formatPlayedAt(value: string | null): string | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
