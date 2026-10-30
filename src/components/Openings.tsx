import { BookOpen } from 'lucide-react'
import type { IOpeningCount } from '@/lib/board'
import { cn } from '@/lib/utils'

interface IOpeningsProps {
  openings: IOpeningCount[]
}

interface IOpeningRowProps {
  opening: IOpeningCount
  rank: number
  leader: boolean
}

interface IOpeningStatProps {
  title: string
  value: number
}

interface IOpeningColumn {
  key: 'games' | 'whiteWins' | 'draws' | 'blackWins'
  label: string
  title: string
}

const columns: IOpeningColumn[] = [
  { key: 'games', label: 'G', title: 'Games' },
  { key: 'whiteWins', label: 'W', title: 'White wins' },
  { key: 'draws', label: 'D', title: 'Draws' },
  { key: 'blackWins', label: 'B', title: 'Black wins' },
]

const resultColumns: IOpeningColumn[] = columns.filter((column) => column.key !== 'games')

export function Openings(props: IOpeningsProps) {
  const { openings } = props
  const top = openings[0]?.games ?? 0
  const contested = openings.some((opening) => opening.games < top)

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <BookOpen className="size-4" />
        </span>
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Club</p>
          <h2 className="text-3xl font-bold tracking-normal">Openings</h2>
        </div>
      </div>
      {openings.length === 0 ? <p className="mt-6 text-muted-foreground">No named openings yet.</p> : null}
      {openings.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                <th className="py-2 pr-2 text-left font-bold" scope="col">
                  #
                </th>
                <th className="py-2 pr-3 text-left font-bold" scope="col">
                  Opening
                </th>
                <th className="w-9 px-1 py-2 text-center font-bold" scope="col" title="Games">
                  G
                </th>
                {resultColumns.map((column) => (
                  <th className="w-9 px-1 py-2 text-center font-bold" key={column.key} scope="col" title={column.title}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openings.map((opening, index) => (
                <OpeningRow key={opening.name} leader={contested && opening.games === top} opening={opening} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">G games · W white wins · D draws · B black wins. Sorted by games played.</p>
    </section>
  )
}

function OpeningRow(props: IOpeningRowProps) {
  const { opening, rank, leader } = props

  return (
    <tr className={cn('border-b border-border last:border-b-0', leader && 'bg-muted/30')}>
      <th className="py-2.5 pr-2 text-left font-bold tabular-nums" scope="row">
        {rank}
      </th>
      <td className="py-2.5 pr-3 font-bold">{opening.name}</td>
      <td className={cn('px-1 py-2.5 text-center font-bold tabular-nums', leader && 'text-emerald-700 dark:text-emerald-400')} title="Games">
        {opening.games}
      </td>
      <OpeningStat title="White wins" value={opening.whiteWins} />
      <OpeningStat title="Draws" value={opening.draws} />
      <OpeningStat title="Black wins" value={opening.blackWins} />
    </tr>
  )
}

function OpeningStat(props: IOpeningStatProps) {
  const { title, value } = props

  return (
    <td className="px-1 py-2.5 text-center tabular-nums text-muted-foreground" title={title}>
      {value}
    </td>
  )
}
