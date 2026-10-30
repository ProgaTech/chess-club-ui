import { ChevronDown, CircleCheck, Crown, ExternalLink, Plus, Swords } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { GameBoard } from '@/components/GameBoard'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { pointLabel } from '@/lib/board'
import { canAddMatchGame, useClubAccount } from '@/lib/club-account'
import type { IAddMatchGame, IBoardDraw, IBoardGame, IBoardPair, ISignupPlayer } from '@/lib/board'
import { playerPath } from '@/lib/players'
import { roundSchedule, roundTiming } from '@/lib/tournament'
import { cn } from '@/lib/utils'

interface IDrawRoundProps {
  draw: IBoardDraw
  roster: ISignupPlayer[]
  onAddGame: (game: IAddMatchGame) => Promise<string | null>
  collapsible?: boolean
  defaultOpen?: boolean
  compactMatches?: boolean
}

interface IMatchCardProps {
  pair: IBoardPair
  roster: ISignupPlayer[]
  onAddGame: (url: string) => Promise<string | null>
  compact?: boolean
}

interface IByeCardProps {
  pair: IBoardPair
  roster: ISignupPlayer[]
}

interface IPlayerNameProps {
  name: string
  roster: ISignupPlayer[]
  align?: 'start' | 'end'
  showNote?: boolean
}

interface IGameRowsProps {
  games: IBoardGame[]
}

interface IGameFormProps {
  pair: IBoardPair
  roster: ISignupPlayer[]
  onAdd: (url: string) => Promise<string | null>
}

interface IStatusBadgeProps {
  pair: IBoardPair
}

export function DrawRound(props: IDrawRoundProps) {
  const { draw, roster, onAddGame, collapsible = false, defaultOpen = true, compactMatches = false } = props
  const [open, setOpen] = useState(defaultOpen)
  const schedule = roundSchedule(draw.round)
  const timing = schedule ? roundTiming(schedule) : null
  const finished = draw.pairs.filter((pair) => isSettled(pair.status)).length
  const progress = draw.pairs.length === 0 ? 0 : Math.round((finished / draw.pairs.length) * 100)
  const expanded = !collapsible || open

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Round {draw.round}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">{formatSavedAt(draw.createdAt)}</h2>
        </div>
        {collapsible ? (
          <button
            aria-expanded={open}
            className={cn(buttonVariants({ size: 'icon', variant: 'outline' }), 'shrink-0')}
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
            <span className="sr-only">{open ? 'Hide matches' : 'Show matches'}</span>
          </button>
        ) : null}
      </div>
      {schedule ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {timing === 'past' ? 'Deadline passed' : timing === 'current' ? 'This round' : 'Upcoming'}
          <span className="mx-2 text-secondary">·</span>
          {schedule.deadline}
        </p>
      ) : null}
      <div className="mt-4">
        <div
          aria-valuemax={draw.pairs.length}
          aria-valuenow={finished}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {finished} of {draw.pairs.length} matches finished
        </p>
      </div>
      {expanded && draw.pairs.length === 0 ? <p className="mt-6 text-muted-foreground">No pairs in this draw.</p> : null}
      {expanded ? <div className="mt-5 grid gap-3">
        {draw.pairs.map((pair) =>
          pair.black ? (
            <MatchCard
              compact={compactMatches}
              key={`${pair.white}-${pair.black}`}
              onAddGame={(url) =>
                onAddGame({
                  white: pair.white,
                  black: pair.black ?? '',
                  url,
                })
              }
              pair={pair}
              roster={roster}
            />
          ) : (
            <ByeCard key={`${pair.white}-bye`} pair={pair} roster={roster} />
          ),
        )}
      </div> : null}
    </section>
  )
}

function MatchCard(props: IMatchCardProps) {
  const { pair, roster, onAddGame, compact = false } = props
  const { state } = useClubAccount()
  const [detailsOpen, setDetailsOpen] = useState(!compact)
  const [modalOpen, setModalOpen] = useState(false)
  const black = pair.black ?? ''
  const pendingGames = pair.games.filter((game) => game.outcome === 'unknown').length
  const showDetails = !compact || detailsOpen

  const folded = compact && !detailsOpen

  return (
    <article className={cn('rounded-2xl border border-border bg-background', folded ? 'px-4 py-3' : 'p-4')}>
      {folded ? (
        <div className="flex items-center gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <CompactName name={pair.white} pair={pair} roster={roster} />
            <CompactScore pair={pair} />
            <CompactName align="end" name={black} pair={pair} roster={roster} />
          </div>
          <MatchChevron open={detailsOpen} onToggle={() => setDetailsOpen((current) => !current)} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end gap-2">
            <StatusBadge pair={pair} />
            {compact ? <MatchChevron open={detailsOpen} onToggle={() => setDetailsOpen((current) => !current)} /> : null}
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
            <PlayerSide name={pair.white} pair={pair} roster={roster} side="white" />
            <ScoreBlock pair={pair} />
            <PlayerSide align="end" name={black} pair={pair} roster={roster} side="black" />
          </div>
          <p className="mt-4 flex items-center gap-2 font-bold">
            {pair.winner ? <Crown className="size-4 text-secondary" /> : <Swords className="size-4 text-secondary" />}
            {leadText(pair)}
          </p>
        </>
      )}
      {showDetails && pendingGames > 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingGames === 1 ? '1 shared game is still unscored.' : `${pendingGames} shared games are still unscored.`}
        </p>
      ) : null}
      {showDetails && pair.games.length > 0 ? (
        <div className="mt-3 border-t border-border pt-1">
          <GameRows games={pair.games} />
        </div>
      ) : null}
      {showDetails && pair.status !== 'skipped' && canAddMatchGame(state, pair.white, black) ? (
        <div className="mt-3 flex justify-end">
          <button
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            onClick={() => setModalOpen(true)}
            type="button"
          >
            <Plus />
            {pair.games.length === 0 ? 'Add game' : 'Add another'}
          </button>
        </div>
      ) : null}
      <Dialog onOpenChange={setModalOpen} open={modalOpen}>
        <DialogContent className="max-w-lg">
          <GameForm onAdd={onAddGame} pair={pair} roster={roster} />
        </DialogContent>
      </Dialog>
    </article>
  )
}

function ByeCard(props: IByeCardProps) {
  const { pair, roster } = props

  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Bye</p>
        <StatusBadge pair={pair} />
      </div>
      <p className="mt-4 text-xl font-bold">
        <PlayerName name={pair.white} roster={roster} />
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Crown className="size-4 text-secondary" />
        {pair.white} takes a bye · {pointLabel(pair.whitePoints)}
      </p>
    </article>
  )
}

interface IMatchChevronProps {
  open: boolean
  onToggle: () => void
}

function MatchChevron(props: IMatchChevronProps) {
  const { open, onToggle } = props

  return (
    <button
      aria-expanded={open}
      className={cn(buttonVariants({ size: 'icon-sm', variant: 'outline' }), 'shrink-0')}
      onClick={onToggle}
      type="button"
    >
      <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
      <span className="sr-only">{open ? 'Hide games' : 'Show games'}</span>
    </button>
  )
}

interface ICompactNameProps {
  name: string
  pair: IBoardPair
  roster: ISignupPlayer[]
  align?: 'start' | 'end'
}

function CompactName(props: ICompactNameProps) {
  const { name, pair, roster, align = 'start' } = props
  const winner = pair.winner !== null && pair.winner.toLowerCase() === name.toLowerCase()

  return (
    <p className={cn('min-w-0 text-base font-bold break-words', align === 'end' && 'text-right', winner && 'text-emerald-700 dark:text-emerald-400')}>
      <PlayerName align={align} name={name} roster={roster} showNote={false} />
    </p>
  )
}

interface ICompactScoreProps {
  pair: IBoardPair
}

function CompactScore(props: ICompactScoreProps) {
  const { pair } = props
  const scored = pair.games.some((game) => game.outcome !== 'unknown')

  if (pair.status === 'skipped') {
    return <p className="shrink-0 text-center text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">Skip</p>
  }

  return (
    <p className="shrink-0 text-center text-2xl font-bold tabular-nums tracking-normal">
      {scored ? (
        <>
          {pair.whiteGameWins}
          <span className="mx-1 text-muted-foreground">–</span>
          {pair.blackGameWins}
        </>
      ) : (
        <span className="text-muted-foreground">–</span>
      )}
    </p>
  )
}

interface IPlayerSideProps {
  name: string
  pair: IBoardPair
  roster: ISignupPlayer[]
  side: 'white' | 'black'
  align?: 'start' | 'end'
}

function PlayerSide(props: IPlayerSideProps) {
  const { name, pair, roster, side, align = 'start' } = props
  const points = side === 'white' ? pair.whitePoints : pair.blackPoints
  const winner = pair.winner !== null && pair.winner.toLowerCase() === name.toLowerCase()
  const showPoints = pair.status === 'played' || pair.status === 'split' || pair.status === 'bye' || pair.status === 'skipped'
  const player = roster.find((row) => row.name.toLowerCase() === name.toLowerCase())
  const note = playerNote(player)

  return (
    <div className={cn('min-w-0', align === 'end' && 'text-right')}>
      <p className={cn('text-lg font-bold break-words', winner && 'text-emerald-700 dark:text-emerald-400')}>
        <PlayerName align={align} name={name} roster={roster} showNote={false} />
      </p>
      {showPoints ? (
        <p className={cn('mt-1 text-sm font-bold tabular-nums', winner ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
          {pointLabel(points)}
        </p>
      ) : null}
      {note ? <p className="mt-1 text-sm font-normal text-muted-foreground">{note}</p> : null}
    </div>
  )
}

interface IScoreBlockProps {
  pair: IBoardPair
}

function ScoreBlock(props: IScoreBlockProps) {
  const { pair } = props
  const scored = pair.games.some((game) => game.outcome !== 'unknown')

  if (!scored) {
    return (
      <div className="grid size-14 place-items-center rounded-full bg-muted text-secondary">
        <Swords className="size-5" />
      </div>
    )
  }

  return (
    <div className="shrink-0 pt-0.5 text-center">
      <p className="text-3xl font-bold tabular-nums tracking-normal">
        {pair.whiteGameWins}
        <span className="mx-1 text-muted-foreground">–</span>
        {pair.blackGameWins}
      </p>
      <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">games</p>
      {drawCount(pair) > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">{drawCount(pair) === 1 ? '1 draw' : `${drawCount(pair)} draws`}</p>
      ) : null}
    </div>
  )
}

function StatusBadge(props: IStatusBadgeProps) {
  const { pair } = props

  if (pair.status === 'skipped') {
    return <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Skipped</span>
  }

  if (pair.status === 'played' || pair.status === 'split' || pair.status === 'bye' || pair.games.length > 0) {
    const label = pair.status === 'played' || pair.status === 'split' || pair.status === 'bye' ? 'Played' : 'Shared'
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
        <CircleCheck className="size-3.5" />
        {label}
      </span>
    )
  }

  return <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Not played</span>
}

function GameRows(props: IGameRowsProps) {
  const { games } = props
  const [openUrl, setOpenUrl] = useState<string | null>(null)

  return (
    <ul>
      {games.map((game) => {
        const open = openUrl === game.url
        const details = (
          <>
            <p className="text-sm font-bold">{gameLine(game)}</p>
            {game.summary ? <p className="text-sm text-muted-foreground">{game.summary}</p> : null}
            <a
              className="mt-1 inline-flex items-center gap-1 text-sm text-secondary underline underline-offset-4"
              href={game.url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
              {game.url.replace('https://www.chess.com', 'chess.com')}
            </a>
          </>
        )
        const action = (
          <button
            aria-expanded={open}
            className="text-sm font-bold text-foreground underline underline-offset-4"
            onClick={() => setOpenUrl(open ? null : game.url)}
            type="button"
          >
            {open ? 'Hide board' : 'Show board'}
          </button>
        )

        return (
          <li className="flex items-start gap-2 py-2" key={game.url}>
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            {open ? (
              <div className="min-w-0 flex-1">
                <GameBoard action={action} boardId={game.url} details={details} moveList={game.moveList} />
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">{details}</div>
                {action}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Lives inside the dialog, so its fields reset each time the dialog closes.
function GameForm(props: IGameFormProps) {
  const { pair, roster, onAdd } = props
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const nextMessage = await onAdd(url)
      setMessage(nextMessage)
      if (!nextMessage) {
        setUrl('')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Chess.com</p>
      <DialogTitle className="mt-3 text-3xl">Add a game</DialogTitle>
      <p className="mt-4">
        <PlayerName name={pair.white} roster={roster} />
        <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
        <PlayerName name={pair.black ?? ''} roster={roster} />
      </p>
      {pair.games.length > 0 ? (
        <div className="mt-4">
          <GameRows games={pair.games} />
        </div>
      ) : (
        <p className="mt-4 text-muted-foreground">No games for this match yet.</p>
      )}
      <form className="mt-5 grid gap-3" onSubmit={(event) => void submit(event)}>
        <input
          aria-label="Chess.com game link"
          autoFocus
          className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.chess.com/game/live/…"
          value={url}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} disabled={pending} type="submit">
            {pending ? 'Adding…' : 'Add game'}
          </button>
          <DialogClose className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>Done</DialogClose>
        </div>
        {message ? <p className="text-secondary">{message}</p> : null}
      </form>
    </>
  )
}

function PlayerName(props: IPlayerNameProps) {
  const { name, roster, align = 'start', showNote = true } = props
  const player = roster.find((row) => row.name.toLowerCase() === name.toLowerCase())
  const note = showNote ? playerNote(player) : null

  return (
    <span className="font-bold">
      <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(name)}>
        {name}
      </Link>
      {note ? (
        <span className={cn('mt-1 block text-sm font-normal text-muted-foreground', align === 'end' && 'text-right')}>
          {note}
        </span>
      ) : null}
    </span>
  )
}

function playerNote(player: ISignupPlayer | undefined): string | null {
  if (!player || (!player.claimed && !player.mine)) {
    return null
  }
  if (player.mine) {
    return player.chessCom ? `You · ${player.chessCom}` : 'You'
  }
  return player.chessCom
}

function drawCount(pair: IBoardPair): number {
  return pair.games.filter((game) => game.outcome === 'draw').length
}

function isSettled(status: IBoardPair['status']): boolean {
  return status === 'played' || status === 'split' || status === 'bye' || status === 'skipped'
}

function leadText(pair: IBoardPair): string {
  if (pair.status === 'skipped') {
    return 'Skipped · 0 pts each'
  }
  if (pair.status === 'split') {
    return `Split · ${pointLabel(pair.whitePoints)} each`
  }
  if (pair.status === 'played' && pair.winner) {
    const points = sameName(pair.winner, pair.white) ? pair.whitePoints : pair.blackPoints
    return `${pair.winner} takes the match · ${pointLabel(points)}`
  }
  if (pair.status === 'open') {
    return 'No games shared yet'
  }
  if (pair.whiteGameWins === pair.blackGameWins) {
    return pair.whiteGameWins === 0 ? 'Waiting on a result' : `Level at ${pair.whiteGameWins}–${pair.blackGameWins}`
  }
  const leader = pair.whiteGameWins > pair.blackGameWins ? pair.white : pair.black
  const high = Math.max(pair.whiteGameWins, pair.blackGameWins)
  const low = Math.min(pair.whiteGameWins, pair.blackGameWins)
  return `${leader} leads ${high}–${low} · first to 2`
}

function gameLine(game: IBoardGame): string {
  if (game.winnerName) {
    return `${game.winnerName} won`
  }
  if (game.outcome === 'draw') {
    return 'Draw'
  }
  return 'Result pending'
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
