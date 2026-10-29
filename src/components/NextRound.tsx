import { Repeat, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { DrawReveal } from '@/components/DrawReveal'
import { buttonVariants } from '@/components/ui/button'
import { isOrganizer, useClubAccount } from '@/lib/club-account'
import { rounds } from '@/lib/tournament'
import type { GenerateResult, IDrawReveal, IGenerateChoice, ITestPairing } from '@/lib/use-board'
import { cn } from '@/lib/utils'

type DrawMode = 'score' | 'random'

interface INextRoundProps {
  drawCount: number
  onGenerate: (round: number, choice?: IGenerateChoice) => Promise<GenerateResult>
}

interface IRevealState {
  reveal: IDrawReveal
  grouped: boolean
}

interface IProposal {
  mode: DrawMode
  pairs: ITestPairing[]
}

interface IProposalProps {
  proposal: IProposal
  pending: DrawMode | 'keep' | null
  onKeep: () => void
  onRandom: () => void
}

export function NextRound(props: INextRoundProps) {
  const { drawCount, onGenerate } = props
  const { state } = useClubAccount()
  const round = nextRoundNumber(drawCount)
  const [pending, setPending] = useState<DrawMode | 'keep' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [proposal, setProposal] = useState<IProposal | null>(null)
  const [reveal, setReveal] = useState<IRevealState | null>(null)
  // Saving the round moves the page on, so the reveal stays here even once this card has nothing to draw.
  const revealModal = reveal ? (
    <DrawReveal grouped={reveal.grouped} onClose={() => setReveal(null)} reveal={reveal.reveal} saved />
  ) : null

  if (round === null || !isOrganizer(state)) {
    return revealModal
  }
  const roundNumber = round

  async function generate(mode: DrawMode, kept?: ITestPairing[]) {
    setPending(kept ? 'keep' : mode)
    setMessage(null)
    const result = await onGenerate(roundNumber, { mode, kept })
    if (result.status === 'confirm') {
      setProposal({ mode, pairs: result.pairs })
    } else if (result.status === 'saved') {
      setProposal(null)
      setMessage(result.notice)
      setReveal({ reveal: result.reveal, grouped: mode === 'score' })
    } else {
      setProposal(null)
      setMessage(result.message)
    }
    setPending(null)
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Round {roundNumber}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-normal">Next pairings</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Swiss pairings from match points. Players on the same score are drawn at random. A player who lost the match
        but won a game plays a random player from the score above. A match that is not finished scores 0 for both
        players. Round {roundNumber} can be generated once.
      </p>
      {proposal ? (
        <Proposal
          onKeep={() => void generate(proposal.mode, proposal.pairs)}
          onRandom={() => void generate('random')}
          pending={pending}
          proposal={proposal}
        />
      ) : (
        <button
          className={cn(buttonVariants({ size: 'lg' }), 'mt-5 hover:bg-secondary')}
          disabled={pending !== null}
          onClick={() => void generate('score')}
          type="button"
        >
          {pending ? 'Pairing…' : `Generate round ${roundNumber}`}
        </button>
      )}
      {message ? <p className="mt-3 text-sm text-secondary">{message}</p> : null}
      {revealModal}
    </section>
  )
}

function Proposal(props: IProposalProps) {
  const { proposal, pending, onKeep, onRandom } = props
  const { mode, pairs } = proposal
  const repeats = pairs.filter((pair) => pair.rematch)

  return (
    <div className={cn('mt-5 rounded-2xl border p-4', repeats.length > 0 ? 'border-secondary' : 'border-border')} role="alert">
      <p className="flex items-center gap-2 font-bold">
        {repeats.length > 0 ? <TriangleAlert className="size-4 text-secondary" /> : null}
        {repeats.length === 0
          ? 'Drawn from all players: nobody plays an old opponent'
          : `${repeats.length === 1 ? '1 pair has' : `${repeats.length} pairs have`} already played each other`}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === 'score'
          ? 'There is no way to pair players by score without a repeat. Generate with all players to ignore scores and look for new opponents across the whole field.'
          : 'This draw ignores scores and pairs across all players.'}{' '}
        Nothing is saved yet.
      </p>
      <ul className="mt-3 grid gap-1.5 text-sm">
        {pairs.map((pair) => (
          <li
            className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5', pair.rematch ? 'bg-secondary/15 font-bold' : 'bg-muted')}
            key={`${pair.white}-${pair.black}`}
          >
            <span className="min-w-0 truncate">{pair.black ? `${pair.white} vs ${pair.black}` : `${pair.white} sits out`}</span>
            {pair.rematch ? (
              <span className="ml-auto inline-flex items-center gap-1 text-xs tracking-[0.12em] uppercase">
                <Repeat className="size-3.5" />
                Again
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')}
          disabled={pending !== null}
          onClick={onKeep}
          type="button"
        >
          {pending === 'keep' ? 'Saving…' : 'Keep these pairs'}
        </button>
        <button
          className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
          disabled={pending !== null}
          onClick={onRandom}
          type="button"
        >
          {pending === 'random' ? 'Pairing…' : 'Generate with all players'}
        </button>
      </div>
    </div>
  )
}

function nextRoundNumber(drawCount: number): number | null {
  const next = drawCount + 1
  const current = rounds.find((round) => round.round === drawCount)
  const upcoming = rounds.find((round) => round.round === next)
  if (!current || !upcoming) {
    return null
  }
  const today = dayKey(new Date())
  if (today < current.deadlineOn && today < upcoming.pairingOn) {
    return null
  }
  return next
}

function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
