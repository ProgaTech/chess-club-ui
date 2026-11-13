import { Show, useAuth } from '@clerk/react'
import { ArrowDown, ArrowRight, Check, Crown, Shuffle, Trophy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { useClubAccount } from '@/lib/club-account'
import { clubGet, clubPost } from '@/lib/club-api'
import type { MatchId, PlayoffsResponse } from '@/lib/playoffs'
import { cn } from '@/lib/utils'

export function PlayoffsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-6">
      <Show when="signed-out">
        <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">The championship</p>
        <h1 className="mt-3 text-5xl font-bold">One last seat.</h1>
        <p className="mt-5 text-muted-foreground">Four contenders. One playoff winner. A place in the grand final.</p>
        <Link to="/sign-in" className={cn(buttonVariants(), 'mt-6')}>Sign in to see the bracket</Link>
      </Show>
      <Show when="signed-in"><PlayoffsBoard /></Show>
    </main>
  )
}

function PlayoffsBoard() {
  const { getToken } = useAuth()
  const { state } = useClubAccount()
  const organizer = state.status === 'ready' && state.role === 'organizer'
  const [data, setData] = useState<PlayoffsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<{ match: MatchId; winner: string | null; revision: number } | null>(null)
  const requestVersion = useRef(0)

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current
    try {
      const token = await getToken()
      if (!token) throw new Error('Please sign in again to load the playoff.')
      const next = await clubGet<PlayoffsResponse>('/playoffs', token)
      if (version === requestVersion.current) { setData(next); setError(null) }
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : 'Could not load the playoff.')
    }
  }, [getToken])

  useEffect(() => {
    const requests = requestVersion
    let active = true
    void Promise.resolve().then(() => { if (active) void refresh() })
    const timer = window.setInterval(() => { if (!document.hidden) void refresh() }, 30000)
    return () => { active = false; window.clearInterval(timer); requests.current++ }
  }, [refresh])

  async function save(path: string, body: unknown) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Please sign in again to save the playoff.')
      await clubPost(path, token, body)
      setPending(null)
      setNotice(path.endsWith('/draw') ? 'The draw is saved. Your semifinal matchups are ready.' : 'Result saved. The winner advances automatically.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the playoff.')
    } finally { setBusy(false) }
  }

  const bracket = data?.saved?.bracket
  const winners = bracket?.winners ?? {}
  const finalist = bracket?.finalist ?? data?.finalist ?? null
  const seeds = bracket?.seeds ?? [null, null, null, null]
  const choose = (match: MatchId, winner: string | null) => {
    if (data?.saved) setPending({ match, winner, revision: data.saved.revision })
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Autumn 2026 / The championship</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">One last seat<span className="text-secondary">.</span></h1>
          <p className="mt-4 max-w-xl text-muted-foreground">Four contenders fight for the right to face our four-win finalist. Follow every step to the crown.</p>
        </div>
      </div>

      <div role="status" aria-live="polite" className="mt-6 text-sm">
        {!data && !error ? <p className="text-muted-foreground">Loading qualification and bracket…</p> : null}
        {notice ? <p className="text-secondary">{notice}</p> : null}
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error} The bracket updates automatically every 30 seconds.</p> : null}

      <section aria-labelledby="grand-final-title" className="relative mt-6 overflow-hidden rounded-2xl border border-secondary/25 bg-card shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-8 text-secondary/5"><Trophy size={240} strokeWidth={1} /></div>
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 text-secondary"><Crown className="size-5" /><h2 id="grand-final-title" className="text-xs font-bold tracking-[0.2em] uppercase">The grand final</h2></div>
          <div className="mt-7 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
            <FinalSeat name={finalist} caption="Direct entry · 4 qualifying wins" winner={winners.grand === finalist && !!finalist} />
            <span className="text-center text-xl italic text-muted-foreground/60">vs.</span>
            <FinalSeat name={winners.qualifier ?? null} caption={winners.qualifier ? 'Playoff winner · Challenger' : 'Awaiting the playoff winner'} winner={!!winners.grand && winners.grand === winners.qualifier} />
          </div>
          {winners.grand ? <p className="mt-6 border-t border-secondary/20 pt-5 text-center font-bold text-secondary"><Trophy className="mr-2 inline size-5" />{winners.grand} is the champion</p> : <p className="mt-6 border-t pt-5 text-center text-xs text-muted-foreground">{finalist ? 'One seat secured. One seat to earn.' : 'The four-win player will appear here automatically.'}</p>}
          {organizer && bracket && finalist && winners.qualifier ? <ResultActions match="grand" players={[finalist, winners.qualifier]} winner={winners.grand} busy={busy} choose={choose} /> : null}
        </div>
      </section>

      <section aria-labelledby="playoff-title" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold tracking-[0.16em] text-secondary uppercase">The road to the final</p><h2 id="playoff-title" className="mt-2 text-3xl font-bold">Playoff bracket</h2></div>
          <span className="rounded-full border bg-card px-4 py-2 text-xs font-bold">{bracket ? 'Draw complete' : `${data?.contenders.length ?? 0} / 4 contenders`}</span>
        </div>

        {!bracket ? <div className="mt-6 rounded-xl border border-dashed p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl"><h3 className="font-bold">{data?.canDraw ? 'The field is ready.' : 'The field is taking shape.'}</h3><p className="mt-2 text-sm text-muted-foreground">{data?.reason ?? (data?.canDraw ? 'Four players, three wins each. Draw the semifinal matchups.' : 'Waiting for the latest qualifying results.')}</p></div>
            <button type="button" disabled={!data?.canDraw || !organizer || busy || !!error} onClick={() => void save('/playoffs/draw', {})} className={cn(buttonVariants(), 'bg-secondary text-secondary-foreground hover:bg-secondary/90')}><Shuffle className="size-4" />{busy ? 'Drawing…' : 'Draw playoffs'}</button>
          </div>
          {data && data.contenders.length > 0 ? <ul className="mt-5 flex flex-wrap gap-2" aria-label="Players currently on three wins">{data.contenders.map(name => <li key={name} className="rounded-lg border bg-card px-3 py-2 text-xs">{name}<span className="ml-3 font-bold text-secondary">3 W</span></li>)}</ul> : null}
          {!organizer ? <p className="mt-4 text-xs text-muted-foreground">The organizer runs the draw once qualification is complete.</p> : null}
        </div> : null}

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_2rem_1fr_2rem_0.65fr] md:items-center">
          <div><StageLabel number="01" title="Semifinals" /><div className="space-y-5">
            <MatchCard title="Semifinal 1" match="semi1" players={[seeds[0], seeds[1]]} placeholders={['Draw slot 1', 'Draw slot 2']} winner={winners.semi1} organizer={organizer} busy={busy} choose={choose} />
            <MatchCard title="Semifinal 2" match="semi2" players={[seeds[2], seeds[3]]} placeholders={['Draw slot 3', 'Draw slot 4']} winner={winners.semi2} organizer={organizer} busy={busy} choose={choose} />
          </div></div>
          <Connector />
          <div><StageLabel number="02" title="Playoff final" /><MatchCard title="The deciding match" match="qualifier" players={[winners.semi1 ?? null, winners.semi2 ?? null]} placeholders={['Winner of semifinal 1', 'Winner of semifinal 2']} winner={winners.qualifier} organizer={organizer} busy={busy} choose={choose} /></div>
          <Connector />
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-5 text-center"><Trophy className="mx-auto size-8 text-secondary" /><p className="mt-4 text-xs font-bold tracking-widest text-secondary uppercase">Challenger</p><p className="mt-3 text-sm font-bold break-words">{winners.qualifier ?? 'One will advance'}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Earns the second seat in the grand final.</p></div>
        </div>
        <p className="mt-7 text-xs leading-relaxed text-muted-foreground">Semifinal winners advance to the playoff final. Its winner faces the four-win player in the grand final. Qualifying wins stay separate from playoff results.</p>
      </section>

      {pending ? <section aria-label="Confirm match result" className="sticky bottom-4 z-10 mt-8 rounded-xl border border-secondary/30 bg-card p-6 shadow-lg">
        <h2 className="font-bold">{pending.winner ? `Record ${pending.winner} as the winner?` : 'Clear this result?'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">This updates the shared bracket. Changing an earlier result also clears results in later matches that depend on it.</p>
        <div className="mt-4 flex gap-3"><button type="button" className={buttonVariants()} disabled={busy} onClick={() => void save('/playoffs/result', pending)}>{busy ? 'Saving…' : 'Confirm result'}</button><button type="button" className={buttonVariants({ variant: 'outline' })} disabled={busy} onClick={() => setPending(null)}>Cancel</button></div>
      </section> : null}
    </>
  )
}

function FinalSeat({ name, caption, winner }: { name: string | null; caption: string; winner: boolean }) {
  return <div className={cn('min-w-0 rounded-xl border p-5 sm:p-6', name ? 'border-secondary/20 bg-secondary/5' : 'border-dashed bg-face-down')}>
    <p className="text-xs text-muted-foreground">{caption}</p>
    <p className={cn('mt-4 text-2xl font-bold break-words sm:text-3xl', !name && 'text-muted-foreground/50')}>{name ?? '404'}</p>
    <p className="mt-3 flex items-center gap-2 text-xs font-bold text-secondary">{name ? <><Check className="size-3" />{winner ? 'Champion' : 'Seat secured'}</> : 'Player not found… yet'}</p>
  </div>
}

function StageLabel({ number, title }: { number: string; title: string }) {
  return <h3 className="mb-4 text-xs font-bold tracking-wide uppercase"><span className="mr-3 text-secondary">{number}</span>{title}</h3>
}

function Connector() {
  return <div aria-hidden="true" className="flex justify-center text-secondary/40"><ArrowRight className="hidden size-6 md:block" /><ArrowDown className="size-6 md:hidden" /></div>
}

type ResultProps = { match: MatchId; players: [string | null, string | null]; winner?: string; busy: boolean; choose: (match: MatchId, winner: string | null) => void }

function MatchCard({ title, placeholders, organizer, ...props }: ResultProps & { title: string; placeholders: [string, string]; organizer: boolean }) {
  return <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b px-4 py-3"><h4 className="text-xs font-bold">{title}</h4><span className="text-[10px] text-muted-foreground">{props.winner ? 'Complete' : props.players.every(Boolean) ? 'Ready to play' : 'Pending'}</span></div>
    <div className="divide-y">{props.players.map((name, index) => <div key={index} className={cn('flex min-h-16 items-center gap-3 px-4 py-4', props.winner === name && 'bg-secondary/5')}>
      <span aria-hidden="true" className={cn('grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold', name ? 'bg-muted' : 'border border-dashed text-muted-foreground')}>{name ? name.split(' ').map(part => part[0]).slice(0, 2).join('') : '?'}</span>
      <span className={cn('min-w-0 flex-1 text-sm break-words', name ? 'font-bold' : 'text-muted-foreground')}>{name ?? placeholders[index]}</span>
      {props.winner === name ? <Check aria-label="Winner" className="size-4 shrink-0 text-secondary" /> : null}
    </div>)}</div>
    {organizer && props.players.every(Boolean) ? <div className="border-t px-4 pb-4"><ResultActions {...props} /></div> : null}
  </article>
}

function ResultActions({ match, players, winner, busy, choose }: ResultProps) {
  return <div className="mt-4"><label className="block text-xs text-muted-foreground">Record match winner
    <select aria-label={`Winner of ${match === 'grand' ? 'grand final' : match === 'qualifier' ? 'playoff final' : match === 'semi1' ? 'semifinal 1' : 'semifinal 2'}`} value={winner ?? ''} disabled={busy} onChange={event => choose(match, event.target.value || null)} className="mt-2 w-full rounded-lg border bg-background p-2 text-sm text-foreground">
      <option value="">{winner ? 'Clear result' : 'Select winner…'}</option>
      {players.filter((name): name is string => name !== null).map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  </label></div>
}
