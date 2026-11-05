import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ClubApiError, clubGet, clubPost, downloadAnalysis } from '@/lib/club-api'

interface Job {
  id: string
  status: 'queued' | 'running' | 'ready' | 'failed'
  progress: { done: number; total: number }
}

export function AnalysisPage() {
  const { isLoaded, userId } = useAuth()
  const { id } = useParams()
  const [query] = useSearchParams()
  const gameId = query.get('game')
  return <main className="mx-auto max-w-3xl px-6 pb-20">
    <h1 className="mt-4 text-4xl font-bold">Game analysis</h1>
    {!isLoaded ? <p>Loading…</p> : !userId ? <Link to="/sign-in">Sign in to analyze a finished game</Link>
      : id ? <Report key={userId + id} id={id} /> : <Submission key={userId + gameId} gameId={gameId} />}
  </main>
}

function message(e: unknown) { return e instanceof Error ? e.message : 'Could not reach the club API.' }

function Submission({gameId}: {gameId: string | null}) {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [pgn,setPgn] = useState('')
  const [confirmed,setConfirmed] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [cooldown,setCooldown] = useState(0)
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(0),cooldown * 1000)
    return () => clearTimeout(timer)
  },[cooldown])
  async function submit() {
    setBusy(true)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Sign in again to continue.')
      const job = await clubPost<Job>('/analyses',token,gameId ? {gameId} : {pgn,finishedConfirmed:confirmed})
      navigate('/analysis/' + job.id)
    } catch(e) {
      setError(message(e))
      if (e instanceof ClubApiError && e.status === 429) setCooldown(e.retryAfter || 10)
    } finally { setBusy(false) }
  }
  return <form className="mt-6 grid gap-4" onSubmit={e => { e.preventDefault(); void submit() }}>
    {gameId ? <p>Analyze saved game {gameId}. <Link className="underline" to="/analysis">Paste a PGN instead</Link></p> : <>
      <label htmlFor="pgn">Paste a finished game in PGN format</label>
      <textarea className="min-h-44 rounded-lg border bg-background p-3 font-mono" id="pgn" required value={pgn} onChange={e => setPgn(e.target.value)} />
      <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> This game has finished.</label>
    </>}
    <Button className="justify-self-start" disabled={busy || !!cooldown || (!gameId && (!pgn.trim() || !confirmed))} type="submit">{busy ? 'Submitting…' : 'Analyze with Stockfish'}</Button>
    {error && <p role="alert">{error}</p>}
  </form>
}

function Report({id}: {id:string}) {
  const { getToken } = useAuth()
  const [job,setJob] = useState<Job | null>(null)
  const [error,setError] = useState('')
  const [refresh,setRefresh] = useState(0)
  const [saving,setSaving] = useState(false)
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>
    let delay = 700
    async function poll() {
      try {
        const token = await getToken()
        if (!token) throw new Error('Sign in again to continue.')
        const data = await clubGet<Job>('/analyses/' + encodeURIComponent(id),token)
        if (!active) return
        setJob(data)
        setError('')
        if (data.status === 'queued' || data.status === 'running') {
          timer = setTimeout(poll,delay)
          delay = Math.min(3000,delay * 1.5)
        }
      } catch(e) { if (active) setError(message(e)) }
    }
    void poll()
    return () => { active = false; clearTimeout(timer) }
  },[id,getToken,refresh])
  async function download() {
    setSaving(true)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Sign in again to continue.')
      await downloadAnalysis(id,token)
    } catch(e) {
      setError(message(e))
      if (e instanceof ClubApiError && e.status === 409) setRefresh(n => n+1)
    } finally { setSaving(false) }
  }
  return <section className="mt-6 grid justify-items-start gap-4">
    <div role="status">{!job ? 'Loading review…' : job.status === 'ready' ? 'Your Markdown report is ready.'
      : job.status === 'failed' ? 'Analysis failed. Submit the game again to retry.'
      : job.status === 'queued' ? 'Queued for analysis…' : 'Analyzing: ' + job.progress.done + ' / ' + job.progress.total + ' plies'}</div>
    {job?.status === 'ready' && <>
      <Button disabled={saving} onClick={download}>{saving ? 'Downloading…' : 'Download Markdown (.md)'}</Button>
      <p>Attach the report to your preferred LLM. The prompt at the end asks it for an interactive HTML board with every move explained.</p>
    </>}
    {error && <div role="alert">{error} <button className="underline" onClick={() => setRefresh(n => n+1)}>Refresh status</button></div>}
    <Link className="underline" to="/analysis">Analyze another game</Link>
  </section>
}
