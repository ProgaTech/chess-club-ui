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

  const payload = await readJson(response)
  if (!response.ok) {
    const errorBody = payload as IApiError | null
    throw new Error(errorBody?.error ?? 'The club API did not accept this session.')
  }

  return payload as T
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
