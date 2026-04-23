import { ApiError } from '../api/client'

/** Разбор тела ответа FastAPI `{"detail": ...}` для показа пользователю. */
export function formatApiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback
  try {
    const parsed = JSON.parse(err.detail) as { detail?: unknown }
    const d = parsed.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d) && d[0] && typeof (d[0] as { msg?: string }).msg === 'string') {
      return (d[0] as { msg: string }).msg
    }
  } catch {
    if (err.detail) return err.detail.slice(0, 280)
  }
  return fallback
}
