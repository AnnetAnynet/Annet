import { API_BASE } from './apiBase'

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number>
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = opts

  let url = `${API_BASE}${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      qs.set(k, String(v))
    }
    url += `?${qs.toString()}`
  }

  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(res.status, text)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(`API ${status}: ${detail}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}
