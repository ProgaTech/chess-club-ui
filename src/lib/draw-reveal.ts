import { pointLabel } from '@/lib/board'
import { pointsTone } from '@/lib/points'
import type { IRevealPair } from '@/lib/use-board'

export type RevealPhase = 'gather' | 'split' | 'shuffle' | 'boards' | 'whites' | 'turn' | 'blacks' | 'done'
export type PieceColor = 'white' | 'black'

// One beat of the show: what is on screen and how long it stays before the next beat.
export interface IRevealFrame {
  phase: RevealPhase
  hold: number
  shuffle: number
  whites: number
  blacks: number
  active: number | null
}

export interface IRevealPot {
  key: string
  label: string
  tone: string
  names: string[]
}

interface ISeat {
  board: number
  color: PieceColor
}

export interface IRevealStage {
  pool: string[]
  pots: IRevealPot[]
  // orders[n][pot] is the pot after n shuffles.
  orders: string[][][]
  seats: Map<string, ISeat>
  tones: Map<string, string>
}

interface IHeadlineInput {
  boards: number
  grouped: boolean
  players: number
  pots: number
  round: number
  saved: boolean
}

// Slow on purpose: names should come out of the pot one at a time, whites first, then blacks.
const HOLD = {
  gather: 2000,
  split: 2200,
  shuffle: 650,
  boards: 1800,
  aim: 550,
  white: 850,
  turn: 2000,
  black: 1150,
}

const SHUFFLES = 5

export function revealTimeline(pairs: IRevealPair[], grouped: boolean): IRevealFrame[] {
  const frames: IRevealFrame[] = []
  let current: IRevealFrame = { phase: 'gather', hold: HOLD.gather, shuffle: 0, whites: 0, blacks: 0, active: null }
  function push(patch: Partial<IRevealFrame>) {
    current = { ...current, ...patch }
    frames.push(current)
  }

  push({})
  if (grouped) {
    push({ phase: 'split', hold: HOLD.split })
  }
  for (let shuffle = 1; shuffle <= SHUFFLES; shuffle += 1) {
    push({ phase: 'shuffle', hold: HOLD.shuffle, shuffle })
  }
  push({ phase: 'boards', hold: HOLD.boards })
  // Each seat takes two frames: the name is picked out of its pot, then it flies to the board.
  pairs.forEach((_, index) => {
    push({ phase: 'whites', hold: HOLD.aim, active: index })
    push({ hold: HOLD.white, whites: index + 1 })
  })
  push({ phase: 'turn', hold: HOLD.turn, active: null })
  pairs.forEach((_, index) => {
    push({ phase: 'blacks', hold: HOLD.aim, active: index })
    push({ hold: HOLD.black, blacks: index + 1 })
  })
  push({ phase: 'done', hold: 0, active: null })
  return frames
}

// A score draw splits players into point groups; a random draw keeps everyone in one pot.
export function revealStage(pairs: IRevealPair[], grouped: boolean): IRevealStage {
  const seats = new Map<string, ISeat>()
  const points = new Map<string, number>()
  pairs.forEach((pair, board) => {
    seats.set(pair.white.name, { board, color: 'white' })
    points.set(pair.white.name, pair.white.points)
    if (pair.black) {
      seats.set(pair.black.name, { board, color: 'black' })
      points.set(pair.black.name, pair.black.points)
    }
  })

  const pool = shuffled([...points.keys()])
  const pots = grouped ? pointPots(pool, points) : [{ key: 'all', label: 'All players', tone: 'bg-muted', names: pool }]
  const orders = [pots.map((pot) => pot.names)]
  for (let shuffle = 1; shuffle <= SHUFFLES; shuffle += 1) {
    const previous = orders[shuffle - 1] ?? []
    orders.push(previous.map((names) => shuffled(names)))
  }
  const tones = new Map<string, string>()
  for (const pot of pots) {
    for (const name of pot.names) {
      tones.set(name, pot.tone)
    }
  }

  return { pool, pots, orders, seats, tones }
}

export function isSeated(stage: IRevealStage, frame: IRevealFrame, name: string): boolean {
  const seat = stage.seats.get(name)
  if (!seat) {
    return false
  }
  return seat.color === 'white' ? seat.board < frame.whites : seat.board < frame.blacks
}

// The name that is glowing in its pot, about to fly to its board.
export function pickedName(frame: IRevealFrame, pairs: IRevealPair[]): string | null {
  if (frame.active === null) {
    return null
  }
  const pair = pairs[frame.active]
  if (frame.phase === 'whites' && frame.whites === frame.active) {
    return pair?.white.name ?? null
  }
  if (frame.phase === 'blacks' && frame.blacks === frame.active) {
    return pair?.black?.name ?? null
  }
  return null
}

export function revealHeadline(frame: IRevealFrame, input: IHeadlineInput): { title: string; detail: string } {
  const { boards, grouped, players, pots, round, saved } = input
  const board = frame.active === null ? '' : `Board ${frame.active + 1} of ${boards}`

  switch (frame.phase) {
    case 'gather':
      return { title: 'Players are in', detail: `${players} players for round ${round}` }
    case 'split':
      return { title: 'Split by points', detail: pots === 1 ? 'Everyone is on the same score' : `${pots} groups by match points` }
    case 'shuffle':
      return { title: 'Shuffling', detail: grouped ? 'Every group is mixed at random' : 'Scores are ignored: one pot for everyone' }
    case 'boards':
      return { title: 'Boards are set', detail: `${boards} boards · white is drawn first` }
    case 'whites':
      return { title: 'Drawing white', detail: board }
    case 'turn':
      return { title: 'Now black', detail: 'Every white seat is taken' }
    case 'blacks':
      return { title: 'Drawing black', detail: board }
    case 'done':
      return saved
        ? { title: `Round ${round} is drawn`, detail: 'The pairs are saved. Good luck at the boards!' }
        : { title: 'Test draw', detail: 'Nothing is saved.' }
  }
}

function pointPots(pool: string[], points: Map<string, number>): IRevealPot[] {
  const values = [...new Set(points.values())].sort((left, right) => right - left)
  return values.map((value) => ({
    key: `points-${value}`,
    label: pointLabel(value),
    tone: pointsTone(value),
    names: pool.filter((name) => points.get(name) === value),
  }))
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    const item = copy[index] as T
    copy[index] = copy[other] as T
    copy[other] = item
  }
  return copy
}
