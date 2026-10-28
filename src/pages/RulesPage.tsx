import {
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Flag,
  Radio,
  Shuffle,
  Scale,
  Swords,
  Timer,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { activeRound, matchRules, rounds, roundTiming, stages, swissOverview } from '@/lib/tournament'
import type { IMatchRule, ITournamentRound, ITournamentStage } from '@/lib/tournament'
import { cn } from '@/lib/utils'

interface IStageIconProps {
  id: string
}

interface IRuleCardProps {
  rule: IMatchRule
}

interface IDeadlineRowProps {
  round: ITournamentRound
}

const stageIcons: Record<string, LucideIcon> = {
  registration: UserRound,
  draw: Shuffle,
  matches: Swords,
  scoring: ClipboardCheck,
  final: Radio,
}

export function RulesPage() {
  const current = activeRound()

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Autumn 2026</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Tournament rules</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Four Swiss rounds. Pairings land on Friday, and the games are due the following Thursday.
      </p>

      {current ? (
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
          <Flag className="size-4" />
          Round {current.round} is open until {current.deadline}
        </p>
      ) : null}

      <section className="mt-10 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Overview</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal">Швейцарська система</h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">{swissOverview}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {['4 rounds', 'No elimination', '10 min games', 'First to 2 wins'].map((item) => (
            <li className="rounded-full bg-muted px-3 py-1 text-sm font-bold" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Timeline</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal">Етапи</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {stages.map((stage, index) => (
            <StageCard index={index} key={stage.id} stage={stage} />
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Deadlines</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal">Тури</h2>
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-left">
            <thead className="bg-muted text-xs font-bold tracking-[0.14em] uppercase">
              <tr>
                <th className="px-4 py-3">Тур</th>
                <th className="px-4 py-3">Жеребкування</th>
                <th className="px-4 py-3">Дедлайн</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <DeadlineRow key={round.round} round={round} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">How a match works</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal">Інші правила</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {matchRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </section>
    </main>
  )
}

interface IStageCardProps {
  stage: ITournamentStage
  index: number
}

function StageCard(props: IStageCardProps) {
  const { stage, index } = props

  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <StageIcon id={stage.id} />
      </span>
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">0{index + 1}</p>
        <p className="mt-1 text-lg font-bold">{stage.title}</p>
      </div>
    </li>
  )
}

function StageIcon(props: IStageIconProps) {
  const { id } = props
  const Icon = stageIcons[id] ?? Flag
  return <Icon className="size-4" />
}

function DeadlineRow(props: IDeadlineRowProps) {
  const { round } = props
  const timing = roundTiming(round)

  return (
    <tr className={cn('border-t border-border', timing === 'current' && 'bg-emerald-50 dark:bg-emerald-950/40')}>
      <td className="px-4 py-4 font-bold">
        <span className="inline-flex items-center gap-2">
          {timing === 'past' ? <CircleCheck className="size-4 text-emerald-600" /> : null}
          {round.round}
          {timing === 'current' ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">Now</span>
          ) : null}
        </span>
      </td>
      <td className="px-4 py-4">{round.pairing}</td>
      <td className="px-4 py-4">{round.deadline}</td>
    </tr>
  )
}

function RuleCard(props: IRuleCardProps) {
  const { rule } = props
  const Icon = rule.id === 'time' ? Timer : rule.id === 'deadline' ? CalendarClock : rule.id === 'points' ? Scale : Swords

  return (
    <article className={cn('rounded-2xl border border-border bg-card p-5', rule.id === 'points' && 'md:col-span-3')}>
      <span className="grid size-10 place-items-center rounded-full bg-muted text-secondary">
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-xs font-bold tracking-[0.14em] text-secondary uppercase">{rule.eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold tracking-normal">{rule.title}</h3>
      {rule.id === 'deadline' ? <DeadlineList /> : (
        <>
          <p className="mt-3 text-3xl font-bold tracking-normal">{rule.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{rule.detail}</p>
        </>
      )}
    </article>
  )
}

function DeadlineList() {
  return (
    <ul className="mt-4 grid gap-2">
      {rounds.map((round) => {
        const timing = roundTiming(round)
        return (
          <li
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm',
              timing === 'current' ? 'bg-emerald-50 font-bold dark:bg-emerald-950/40' : 'bg-muted',
            )}
            key={round.round}
          >
            <span>Тур {round.round}</span>
            <span>{round.deadline}</span>
          </li>
        )
      })}
    </ul>
  )
}
