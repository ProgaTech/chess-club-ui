interface IApiError {
  error?: string
}

interface IClubRequest {
  path: string
  token: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
const viewAsKey = 'chess-club:view-as'

// Organizers can browse as a member to test. The API only lets this header lower a role.
export function viewingAsMember(): boolean {
  try {
    return localStorage.getItem(viewAsKey) === 'member'
  } catch {
    return false
  }
}

export function setViewingAsMember(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(viewAsKey, 'member')
    } else {
      localStorage.removeItem(viewAsKey)
    }
  } catch {
    // Storage is blocked. The switch just stays off.
  }
}

export function clubGet<T>(path: string, token: string): Promise<T> {
  return clubRequest<T>({ path, token, method: 'GET' })
}

export function clubPost<T>(path: string, token: string, body: unknown): Promise<T> {
  return clubRequest<T>({ path, token, method: 'POST', body })
}

export function clubPut<T>(path: string, token: string, body: unknown): Promise<T> {
  return clubRequest<T>({ path, token, method: 'PUT', body })
}

export function clubDelete<T>(path: string, token: string, body: unknown): Promise<T> {
  return clubRequest<T>({ path, token, method: 'DELETE', body })
}

async function clubRequest<T>(request: IClubRequest): Promise<T> {
  return await readJson(await clubResponse(request)) as T
}

export async function downloadAnalysis(id: string, token: string) {
  const response = await clubResponse({ path: '/analyses/' + encodeURIComponent(id) + '/report.md', token, method: 'GET' })
  if (!response.headers.get('Content-Type')?.startsWith('text/markdown')) throw new Error('Expected a Markdown report.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = 'chess-analysis-' + id + '.md'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export class ClubApiError extends Error {
  status: number
  retryAfter: number
  constructor(message: string, response: Response) {
    super(message)
    this.status = response.status
    this.retryAfter = Number(response.headers.get('Retry-After')) || 0
  }
}

async function clubResponse(request: IClubRequest) {
  const { path, token, method, body } = request
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(viewingAsMember() ? { 'X-View-As': 'member' } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await readJson(response)
    const errorBody = payload as IApiError | null
    throw new ClubApiError(errorBody?.error ?? 'The club API did not accept this session.', response)
  }

  return response
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('The club API returned an unexpected response.')
  }
}
