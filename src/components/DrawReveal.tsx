import { RotateCcw, Shuffle, SkipForward, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { isSeated, pickedName, revealHeadline, revealStage, revealTimeline } from '@/lib/draw-reveal'
import type { IRevealFrame, IRevealPot, IRevealStage, PieceColor } from '@/lib/draw-reveal'
import { useFlip } from '@/lib/use-flip'
import type { IDrawReveal, IRevealPair } from '@/lib/use-board'
import { cn } from '@/lib/utils'

interface IDrawRevealProps {
  reveal: IDrawReveal
  // A score draw splits players into point groups first; a random draw keeps one group.
  grouped: boolean
  saved: boolean
  onClose: () => void
}

interface IRevealShowProps {
  reveal: IDrawReveal
  grouped: boolean
  saved: boolean
  onReplay: () => void
}

interface IPotCardProps {
  pot: IRevealPot
  names: string[]
  frame: IRevealFrame
  picked: string | null
  stage: IRevealStage
}

interface IChipProps {
  name: string
  dot: string
  seat?: boolean
  picked?: boolean
  flipDelay?: number
  popDelay?: number
}

interface IGhostProps {
  name: string
}

interface IBoardRowProps {
  pair: IRevealPair
  index: number
  frame: IRevealFrame
  count: number
}

interface ISeatProps {
  name: string | null
  color: PieceColor
  shown: boolean
  waiting: boolean
  align?: 'start' | 'end'
}

const FLIGHT_MS = 750
const MOVE_MS = 480
const SEAT_DOTS: Record<PieceColor, string> = { white: 'bg-white', black: 'bg-foreground dark:bg-background' }

export function DrawReveal(props: IDrawRevealProps) {
  const { reveal, grouped, saved, onClose } = props
  const [run, setRun] = useState(0)

  // Escape closes it; a stray click outside does not stop the show.
  return (
    <Dialog
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open
    >
      <DialogContent
        backdropClassName="bg-foreground/75 backdrop-blur-sm duration-300 motion-safe:animate-in motion-safe:fade-in"
        className="flex h-[min(92vh,60rem)] max-w-5xl flex-col overflow-hidden rounded-3xl p-0 shadow-2xl duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        viewportClassName="p-3 sm:p-6"
      >
        <RevealShow
          grouped={grouped}
          key={run}
          onReplay={() => setRun((current) => current + 1)}
          reveal={reveal}
          saved={saved}
        />
      </DialogContent>
    </Dialog>
  )
}

function RevealShow(props: IRevealShowProps) {
  const { reveal, grouped, saved, onReplay } = props
  const [reduced] = useState(prefersReducedMotion)
  const [stage] = useState(() => revealStage(reveal.pairs, grouped))
  const [frames] = useState(() => revealTimeline(reveal.pairs, grouped))
  // Reduced motion still reveals one seat at a time; only the flying and popping is left out.
  const [step, setStep] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const snapshot = useFlip(bodyRef, step, { enabled: !reduced, moveMs: MOVE_MS, landMs: FLIGHT_MS })
  const last = frames.length - 1
  const frame = frames[step] ?? frames[last]
  const done = frame.phase === 'done'

  const goTo = useCallback(
    (next: number) => {
      snapshot()
      setStep(next)
    },
    [snapshot],
  )

  useEffect(() => {
    if (step >= last) {
      return
    }
    const timer = window.setTimeout(() => goTo(step + 1), frames[step]?.hold ?? 0)
    return () => window.clearTimeout(timer)
  }, [frames, goTo, last, step])

  useEffect(() => {
    if (frame.active === null) {
      return
    }
    const row = bodyRef.current?.querySelector(`[data-board="${frame.active}"]`)
    row?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [frame.active, reduced])

  useEffect(() => {
    if (done) {
      bodyRef.current?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    }
  }, [done, reduced])

  const picked = pickedName(frame, reveal.pairs)
  const showBoards = frames.findIndex((item) => item.phase === 'boards') <= step
  const pots: IRevealPot[] =
    frame.phase === 'gather'
      ? [{ key: grouped ? 'pool' : 'all', label: 'All players', tone: 'bg-muted', names: stage.pool }]
      : stage.pots
  const orders = frame.phase === 'gather' ? [stage.pool] : (stage.orders[frame.shuffle] ?? stage.orders[0] ?? [])
  const text = revealHeadline(frame, {
    boards: reveal.pairs.length,
    grouped,
    players: stage.pool.length,
    pots: stage.pots.length,
    round: reveal.round,
    saved,
  })

  return (
    <>
      <div className="h-1 shrink-0 bg-muted">
        <div
          className="h-full bg-secondary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${last === 0 ? 100 : Math.round((step / last) * 100)}%` }}
        />
      </div>
      <header className="flex shrink-0 items-start gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div aria-live="polite" className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
            {saved ? `Round ${reveal.round} draw` : `Round ${reveal.round} test draw`}
          </p>
          <DialogTitle className="mt-1 text-2xl motion-safe:animate-draw-rise sm:text-3xl" key={text.title}>
            {text.title}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">{text.detail}</p>
        </div>
        <DialogClose className={cn(buttonVariants({ size: 'icon', variant: 'outline' }), 'shrink-0')}>
          <X />
          <span className="sr-only">Close</span>
        </DialogClose>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto" ref={bodyRef}>
        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div
            className={cn(
              'flex flex-wrap content-start gap-3 md:sticky md:top-0 md:self-start',
              done && 'max-md:hidden',
            )}
          >
            {pots.map((pot, index) => (
              <PotCard
                frame={frame}
                key={pot.key}
                names={orders[index] ?? pot.names}
                picked={picked}
                pot={pot}
                stage={stage}
              />
            ))}
          </div>
          <div className="min-w-0">
            {showBoards ? (
              <>
                <div className="flex items-center gap-3 text-xs font-bold tracking-[0.14em] uppercase">
                  <span>Boards</span>
                  <span className={cn('ml-auto inline-flex items-center gap-1.5', frame.phase === 'whites' && 'text-secondary')}>
                    <span className={cn('size-2.5 rounded-full border border-foreground/50', SEAT_DOTS.white)} />
                    White
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      (frame.phase === 'turn' || frame.phase === 'blacks') && 'text-secondary',
                    )}
                  >
                    <span className={cn('size-2.5 rounded-full border border-foreground/50', SEAT_DOTS.black)} />
                    Black
                  </span>
                </div>
                <ol className="mt-3 grid gap-2">
                  {reveal.pairs.map((pair, index) => (
                    <BoardRow
                      count={reveal.pairs.length}
                      frame={frame}
                      index={index}
                      key={`${pair.white.name}-${pair.black?.name ?? 'bye'}`}
                      pair={pair}
                    />
                  ))}
                </ol>
              </>
            ) : (
              <p className="hidden rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:block">
                Boards are laid out after the shuffle.
              </p>
            )}
          </div>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-4 sm:px-6">
        {done ? (
          <>
            <button className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))} onClick={onReplay} type="button">
              <RotateCcw />
              Watch again
            </button>
            <DialogClose autoFocus className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')}>
              Close
            </DialogClose>
          </>
        ) : (
          <button
            className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
            onClick={() => goTo(last)}
            type="button"
          >
            <SkipForward />
            Skip to pairs
          </button>
        )}
      </footer>
    </>
  )
}

function PotCard(props: IPotCardProps) {
  const { pot, names, frame, picked, stage } = props
  const left = names.filter((name) => !isSeated(stage, frame, name)).length
  const spread = Math.min(70, 1100 / Math.max(names.length, 1))

  return (
    <section
      className={cn(
        'min-w-0 flex-auto rounded-2xl border bg-card p-3 transition-colors duration-300',
        picked && names.includes(picked) ? 'border-secondary' : 'border-border',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('size-3 shrink-0 rounded-full border border-foreground/30', pot.tone)} />
        <span className="text-xs font-bold tracking-[0.14em] uppercase">{pot.label}</span>
        {frame.phase === 'shuffle' ? <Shuffle className="size-3.5 text-secondary motion-safe:animate-pulse" /> : null}
        <span className="ml-auto text-xs font-bold text-muted-foreground tabular-nums">
          {left === names.length ? `${names.length}` : `${left} of ${names.length} left`}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {names.map((name, index) =>
          isSeated(stage, frame, name) ? (
            <Ghost key={`ghost-${name}`} name={name} />
          ) : (
            <Chip
              dot={frame.phase === 'gather' ? 'bg-muted' : (stage.tones.get(name) ?? 'bg-muted')}
              flipDelay={frame.phase === 'split' ? index * 45 : undefined}
              key={name}
              name={name}
              picked={picked === name}
              popDelay={frame.phase === 'gather' ? Math.round(index * spread) : undefined}
            />
          ),
        )}
      </div>
    </section>
  )
}

function Chip(props: IChipProps) {
  const { name, dot, seat = false, picked = false, flipDelay, popDelay } = props
  const popping = !picked && popDelay !== undefined

  return (
    <span
      className={cn(
        'relative z-10 inline-flex h-9 items-center gap-2 rounded-full border bg-background px-3 text-sm font-bold shadow-sm transition-[scale,border-color] duration-300 motion-reduce:transition-none',
        seat ? 'max-w-full' : 'max-w-56',
        picked ? 'scale-110 border-secondary motion-safe:animate-draw-glow' : 'border-border',
        popping && 'motion-safe:animate-draw-pop',
      )}
      data-flip={name}
      data-flip-delay={flipDelay}
      data-flip-land={seat ? '' : undefined}
      style={popping ? delayStyle(popDelay) : undefined}
    >
      <span className={cn('size-2.5 shrink-0 rounded-full border border-foreground/50 transition-colors duration-500', dot)} />
      <span className="truncate">{name}</span>
    </span>
  )
}

function Ghost(props: IGhostProps) {
  const { name } = props

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-9 max-w-56 items-center gap-2 rounded-full border border-dashed border-foreground/20 px-3 text-sm font-bold text-transparent"
    >
      <span className="size-2.5 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  )
}

function BoardRow(props: IBoardRowProps) {
  const { pair, index, frame, count } = props
  const active = frame.active === index
  const laying = frame.phase === 'boards'

  return (
    <li
      className={cn(
        'grid grid-cols-[1.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border bg-card px-3 py-2.5 transition-colors duration-300',
        active ? 'border-secondary motion-safe:animate-draw-glow' : 'border-border',
        laying && 'motion-safe:animate-draw-rise',
      )}
      data-board={index}
      style={laying ? delayStyle(Math.round(index * Math.min(90, 1200 / count))) : undefined}
    >
      <span className="text-sm font-bold text-muted-foreground tabular-nums">{index + 1}</span>
      <Seat color="white" name={pair.white.name} shown={index < frame.whites} waiting={laying} />
      <span className="text-[10px] font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
      <Seat
        align="end"
        color="black"
        name={pair.black?.name ?? null}
        shown={index < frame.blacks}
        waiting={frame.phase === 'turn'}
      />
    </li>
  )
}

function Seat(props: ISeatProps) {
  const { name, color, shown, waiting, align = 'start' } = props

  return (
    <div className={cn('flex min-w-0', align === 'end' && 'justify-end')}>
      {shown && name ? <Chip dot={SEAT_DOTS[color]} name={name} seat /> : null}
      {shown && !name ? (
        <span className="inline-flex h-9 items-center rounded-full bg-muted px-3 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase motion-safe:animate-draw-turn">
          Bye
        </span>
      ) : null}
      {!shown ? (
        <span
          aria-label={color === 'white' ? 'White, not drawn yet' : 'Black, not drawn yet'}
          className={cn(
            'flex h-9 w-full max-w-56 items-center justify-center gap-2 rounded-full border border-dashed border-foreground/25 bg-face-down text-sm font-bold text-muted-foreground',
            waiting && 'motion-safe:animate-draw-glow',
          )}
        >
          <span className={cn('size-2.5 rounded-full border border-foreground/50', SEAT_DOTS[color])} />?
        </span>
      ) : null}
    </div>
  )
}

// Feeds the per-element delay into the theme animations (see --draw-delay in index.css).
function delayStyle(ms: number): CSSProperties {
  return { '--draw-delay': `${ms}ms` } as CSSProperties
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
