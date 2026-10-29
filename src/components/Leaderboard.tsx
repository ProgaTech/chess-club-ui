import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

interface ILeaderboardRow {
  name: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  elo?: number
}

interface ILeaderboardLink {
  to: string
  label: string
}

interface ILeaderboardProps {
  standings: ILeaderboardRow[]
  kicker?: string
  heading?: string
  scoring?: string
  showElo?: boolean
  more?: ILeaderboardLink
}

interface IStandingRowProps {
  standing: ILeaderboardRow
  rank: number
  leader: boolean
  showElo: boolean
}

interface ITableStatProps {
  title: string
  value: number
}

interface ITableColumn {
  key: 'played' | 'wins' | 'draws' | 'losses'
  label: string
  title: string
}

const columns: ITableColumn[] = [
  { key: 'played', label: 'P', title: 'Played' },
  { key: 'wins', label: 'W', title: 'Won' },
  { key: 'draws', label: 'D', title: 'Drawn' },
  { key: 'losses', label: 'L', title: 'Lost' },
]

export function Leaderboard(props: ILeaderboardProps) {
  const { standings, kicker = 'Matches', heading = 'Leaderboard', scoring, showElo = false, more } = props
  const top = standings[0]?.points ?? 0

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Trophy className="size-4" />
        </span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{kicker}</p>
          <h2 className="text-3xl font-bold tracking-normal">{heading}</h2>
        </div>
      </div>
      {standings.length === 0 ? <p className="mt-6 text-muted-foreground">No players in the draw yet.</p> : null}
      {standings.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                <th className="py-2 pr-2 text-left font-bold" scope="col">
                  #
                </th>
                <th className="py-2 pr-3 text-left font-bold" scope="col">
                  Player
                </th>
                {columns.map((column) => (
                  <th className="w-9 px-1 py-2 text-center font-bold" key={column.key} scope="col" title={column.title}>
                    {column.label}
                  </th>
                ))}
                {showElo ? (
                  <th className="w-14 py-2 pl-2 text-center font-bold" scope="col" title="Domestic Elo">
                    Elo
                  </th>
                ) : null}
                <th className="w-12 py-2 pl-2 text-center font-bold" scope="col" title="Points">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => (
                <StandingRow
                  key={standing.name}
                  leader={top > 0 && standing.points === top}
                  rank={index + 1}
                  showElo={showElo}
                  standing={standing}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">
        P played · W won · D drawn · L lost. {scoring ?? 'A win is 1, a draw is 0.5, a bye is 1.'}{' '}
        <Link className="font-semibold text-secondary underline underline-offset-4" to="/rules">
          Rules
        </Link>
        {more ? (
          <>
            {' · '}
            <Link className="font-semibold text-secondary underline underline-offset-4" to={more.to}>
              {more.label}
            </Link>
          </>
        ) : null}
      </p>
    </section>
  )
}

function StandingRow(props: IStandingRowProps) {
  const { standing, rank, leader, showElo } = props

  return (
    <tr className={cn('border-b border-border last:border-b-0', leader && 'bg-muted/30')}>
      <th className="py-2.5 pr-2 text-left font-bold tabular-nums" scope="row">
        {rank}
      </th>
      <td className="py-2.5 pr-3">
        <Link className="font-bold underline-offset-4 hover:text-secondary hover:underline" to={playerPath(standing.name)}>
          {standing.name}
        </Link>
      </td>
      <TableStat title="Played" value={standing.played} />
      <TableStat title="Won" value={standing.wins} />
      <TableStat title="Drawn" value={standing.draws} />
      <TableStat title="Lost" value={standing.losses} />
      {showElo ? (
        <td className="py-2.5 pl-2 text-center font-bold tabular-nums" title="Domestic Elo">
          {standing.elo ?? '—'}
        </td>
      ) : null}
      <td className={cn('py-2.5 pl-2 text-center text-base font-bold tabular-nums', leader && 'text-emerald-700 dark:text-emerald-400')}>
        {tablePoints(standing.points)}
      </td>
    </tr>
  )
}

function TableStat(props: ITableStatProps) {
  const { title, value } = props

  return (
    <td className="px-1 py-2.5 text-center tabular-nums text-muted-foreground" title={title}>
      {value}
    </td>
  )
}

function tablePoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}
