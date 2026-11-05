import { useAuth } from '@clerk/react'
import { Download, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { clubGet, clubPost, downloadAnalysis } from '@/lib/club-api'

interface AnalysisJob {
  id: string
  status: 'queued' | 'running' | 'ready' | 'failed'
  progress?: { done: number; total: number }
}

export function MatchAnalysisButton({ gameId }: { gameId: string }) {
  const { userId } = useAuth()
  return userId ? <AnalysisAction key={userId + gameId} gameId={gameId} /> : null
}

function AnalysisAction({ gameId }: { gameId: string }) {
  const { getToken } = useAuth()
  const [job, setJob] = useState<AnalysisJob | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const jobId = job?.id
  const processing = job?.status === 'queued' || job?.status === 'running'

  useEffect(() => {
    if (!processing || !jobId || error) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const token = await getToken()
        if (!token) throw new Error('Sign in again to continue.')
        const next = await clubGet<AnalysisJob>('/analyses/' + jobId, token)
        if (!active) return
        setJob(next)
        if (next.status === 'running' || next.status === 'queued') timer = setTimeout(poll, 1200)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not check progress.')
      }
    }
    void poll()
    return () => { active = false; clearTimeout(timer) }
  }, [jobId, processing, error, getToken])

  async function click() {
    setError('')
    if (processing) return
    setPending(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Sign in again to continue.')
      if (job?.status === 'ready') await downloadAnalysis(job.id, token)
      else setJob(await clubPost<AnalysisJob>('/analyses', token, { gameId }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get the analysis.')
    } finally {
      setPending(false)
    }
  }

  const busy = pending || (processing && !error)
  let label = 'Get analysis'
  if (job?.status === 'ready') label = 'Download Markdown (.md)'
  else if (processing && error) label = 'Check progress'
  else if (job?.status === 'failed') label = 'Retry analysis'
  else if (job?.progress && processing) label = 'Analyzing ' + job.progress.done + '/' + job.progress.total
  else if (busy) label = 'Starting Stockfish…'

  return <div>
    <Button size="sm" variant="outline" type="button" disabled={busy} onClick={click}>
      {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : job?.status === 'ready' ? <Download className="size-3.5" /> : null}
      <span aria-live="polite">{label}</span>
    </Button>
    {job?.status === 'ready' && <p className="mt-1 text-xs text-muted-foreground">Attach the file to your AI for a written review.</p>}
    {(error || job?.status === 'failed') && <p role="alert" className="mt-1 text-sm">{error || 'Stockfish could not finish this game.'}</p>}
  </div>
}
