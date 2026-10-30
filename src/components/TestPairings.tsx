import { ArrowDown, ArrowUp, Clapperboard, Repeat } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DrawReveal } from '@/components/DrawReveal'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatPoints, pointsTone } from '@/lib/points'
import type { ITestPairing, ITestSide } from '@/lib/use-board'
import { cn } from '@/lib/utils'

interface ITestPairingsProps {
  drawCount: number
  onPreview: (round: number) => Promise<ITestPairing[] | string>
}

interface ITestPairingsModalProps {
  open: boolean
  round: number
  pairs: ITestPairing[]
  pending: boolean
  message: string | null
  onAgain: () => void
  onWatch: () => void
  onClose: () => void
}

interface IKindStyle {
  card: string
  dot: string
  label: string
}

interface IPairCardProps {
  pair: ITestPairing
}

interface IPlayerTileProps {
  side: ITestSide
  color: 'white' | 'black'
  move: 'up' | 'down' | null
  align: 'start' | 'end'
}

interface IWinPipsProps {
  count: number
  align: 'start' | 'end'
}

interface IScoreKeyProps {
  scores: number[]
}

type PairKind = ITestPairing['kind']
type MoveMark = 'up' | 'down' | null

const KIND_STYLES: Record<PairKind, IKindStyle> = {
  same: { card: 'bg-[#e7f2e4] dark:bg-[#22352a]', dot: 'bg-[#3d6b45] dark:bg-[#6fae7b]', label: 'Same score' },
  up: { card: 'bg-[#f8ecd4] dark:bg-[#3d3020]', dot: 'bg-[#a16207] dark:bg-[#d9a441]', label: 'Played up' },
  down: { card: 'bg-[#e4eef8] dark:bg-[#1f2e40]', dot: 'bg-[#1d4e89] dark:bg-[#5b8fd1]', label: 'Played down' },
  bye: { card: 'bg-[#eceae6] dark:bg-[#2c2f2d]', dot: 'bg-[#5e6663] dark:bg-[#a3aba7]', label: 'Bye' },
}

const KIND_ORDER: PairKind[] = ['same', 'up', 'down', 'bye']

export function TestPairings(props: ITestPairingsProps) {
  const { drawCount, onPreview } = props
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [pairs, setPairs] = useState<ITestPairing[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [watching, setWatching] = useState(false)
  const round = drawCount + 1

  if (!searchParams.has('testing') || round < 2) {
    return null
  }

  async function load() {
    setPending(true)
    setMessage(null)
    const result = await onPreview(round)
    if (typeof result === 'string') {
      setPairs([])
      setMessage(result)
      setWatching(false)
    } else {
      setPairs(result)
      // Play the draw first; closing it leaves the detailed test view.
      setWatching(result.length > 0)
    }
    setPending(false)
    setOpen(true)
  }

  return (
    <>
      <button
        className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'mt-5')}
        disabled={pending}
        onClick={() => void load()}
        type="button"
      >
        {pending && !open ? 'Pairing…' : 'Test pairings'}
      </button>
      <TestPairingsModal
        message={message}
        onAgain={() => void load()}
        onClose={() => setOpen(false)}
        onWatch={() => setWatching(true)}
        open={open && !watching}
        pairs={pairs}
        pending={pending}
        round={round}
      />
      {open && watching ? (
        <DrawReveal
          grouped
          onClose={() => setWatching(false)}
          reveal={{ round, pairs: pairs.map((pair) => ({ white: pair.whitePlayer, black: pair.blackPlayer })) }}
          saved={false}
        />
      ) : null}
    </>
  )
}

function TestPairingsModal(props: ITestPairingsModalProps) {
  const { open, round, pairs, pending, message, onAgain, onWatch, onClose } = props
  const scores = scoreList(pairs)

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
      open={open}
    >
      <DialogContent className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Not saved</p>
        <DialogTitle className="mt-3 text-3xl">Round {round} test</DialogTitle>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {KIND_ORDER.map((kind) => (
            <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold', KIND_STYLES[kind].card)} key={kind}>
              <span className={cn('size-2.5 rounded-full', KIND_STYLES[kind].dot)} />
              {KIND_STYLES[kind].label}
            </span>
          ))}
        </div>
        {scores.length > 0 ? <ScoreKey scores={scores} /> : null}
        {pairs.length > 0 ? (
          <ul className="mt-4 grid max-h-[54vh] gap-3 overflow-y-auto pr-1">
            {pairs.map((pair) => (
              <PairCard key={`${pair.white}-${pair.black}`} pair={pair} />
            ))}
          </ul>
        ) : null}
        {message ? <p className="mt-4 text-secondary">{message}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')}
            disabled={pending}
            onClick={onAgain}
            type="button"
          >
            {pending ? 'Pairing…' : 'Draw again'}
          </button>
          {pairs.length > 0 ? (
            <button
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
              disabled={pending}
              onClick={onWatch}
              type="button"
            >
              <Clapperboard />
              Watch the draw
            </button>
          ) : null}
          <DialogClose className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>Close</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ScoreKey(props: IScoreKeyProps) {
  const { scores } = props

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Points</span>
      {scores.map((score) => (
        <span className={cn('grid h-7 min-w-7 place-items-center rounded-lg px-1.5 text-sm font-bold', pointsTone(score))} key={score}>
          {formatPoints(score)}
        </span>
      ))}
      <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Squares = game wins</span>
    </div>
  )
}

function PairCard(props: IPairCardProps) {
  const { pair } = props
  const style = KIND_STYLES[pair.kind]

  return (
    <li className={cn('rounded-2xl p-3', style.card)}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('size-2.5 rounded-full', style.dot)} />
        <span className="text-xs font-bold tracking-[0.12em] uppercase">{style.label}</span>
        {pair.rematch ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold tracking-[0.12em] uppercase">
            <Repeat className="size-3.5" />
            Again
          </span>
        ) : null}
      </div>
      <div className={cn('grid items-stretch gap-2', pair.blackPlayer ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'grid-cols-1')}>
        <PlayerTile
          align="start"
          color="white"
          move={moveOf(pair.kind, pair.whitePlayer, pair.blackPlayer)}
          side={pair.whitePlayer}
        />
        {pair.blackPlayer ? (
          <>
            <span className="self-center text-xs font-bold tracking-[0.14em] uppercase">vs</span>
            <PlayerTile
              align="end"
              color="black"
              move={moveOf(pair.kind, pair.blackPlayer, pair.whitePlayer)}
              side={pair.blackPlayer}
            />
          </>
        ) : null}
      </div>
      <p className="sr-only">{pair.reason}</p>
    </li>
  )
}

function PlayerTile(props: IPlayerTileProps) {
  const { side, color, move, align } = props

  return (
    <div className={cn('rounded-xl bg-card px-3 py-3', align === 'end' && 'text-right')}>
      <div className={cn('flex items-center gap-2', align === 'end' && 'flex-row-reverse')}>
        <span
          className={cn('size-3 shrink-0 rounded-full border border-foreground', color === 'white' ? 'bg-white' : 'bg-foreground dark:bg-background')}
          aria-label={color === 'white' ? 'White' : 'Black'}
        />
        <span className="truncate font-bold">{side.name}</span>
        {move === 'up' ? <ArrowUp aria-label="Played up" className="size-4 shrink-0" /> : null}
        {move === 'down' ? <ArrowDown aria-label="Played down" className="size-4 shrink-0" /> : null}
      </div>
      <div className={cn('mt-3 flex items-end gap-3', align === 'end' && 'flex-row-reverse')}>
        <div>
          <div className={cn('grid size-12 place-items-center rounded-xl text-xl font-bold', pointsTone(side.points))}>
            {formatPoints(side.points)}
          </div>
          <p className="mt-1 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Points</p>
        </div>
        <div className={cn('flex flex-col', align === 'end' ? 'items-end' : 'items-start')}>
          <WinPips align={align} count={side.gameWins} />
          <p className="mt-1 text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Games</p>
        </div>
      </div>
    </div>
  )
}

function WinPips(props: IWinPipsProps) {
  const { count, align } = props
  const shown = Math.min(Math.max(count, 1), 8)
  const extra = count > 8 ? count - 8 : 0

  return (
    <span
      aria-label={count === 1 ? '1 game win' : `${count} game wins`}
      className={cn('flex max-w-24 flex-wrap items-center gap-1', align === 'end' && 'justify-end')}
    >
      {Array.from({ length: shown }, (_, index) => (
        <span
          className={cn('size-2.5 rounded-sm', index < count ? 'bg-foreground' : 'border border-foreground/30')}
          key={index}
        />
      ))}
      {extra > 0 ? <span className="text-xs font-bold">+{extra}</span> : null}
    </span>
  )
}

function scoreList(pairs: ITestPairing[]): number[] {
  const scores = new Set<number>()
  for (const pair of pairs) {
    scores.add(pair.whitePlayer.points)
    if (pair.blackPlayer) {
      scores.add(pair.blackPlayer.points)
    }
  }
  return [...scores].sort((left, right) => right - left)
}

function moveOf(kind: PairKind, side: ITestSide, other: ITestSide | null): MoveMark {
  if (!other) {
    return null
  }
  if (kind === 'up' && side.points < other.points) {
    return 'up'
  }
  if (kind === 'down' && side.points > other.points) {
    return 'down'
  }
  return null
}
