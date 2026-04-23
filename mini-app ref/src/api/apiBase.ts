/** Backend API origin/path. In Vite dev, default is '' so requests stay same-origin and the dev server proxies `/api` → backend (avoids CORS when the page is 127.0.0.1:5173 and .env had http://localhost:8000). */
const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

function localBackendUsesViteProxy(url: string): boolean {
  if (!import.meta.env.DEV) return false
  try {
    const u = new URL(url)
    const port = u.port || (u.protocol === 'https:' ? '443' : '80')
    return (
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1') &&
      port === '8000'
    )
  } catch {
    return false
  }
}

function resolveBase(): string {
  const v = envUrl?.trim() ?? ''
  if (v !== '' && localBackendUsesViteProxy(v)) {
    return ''
  }
  if (v !== '') return v
  if (import.meta.env.DEV) return ''
  return 'https://api.annet.cloud'
}

export const API_BASE: string = resolveBase()

/** Shown in debug / error UI when API_BASE is empty. */
export const API_BASE_LABEL: string =
  API_BASE === ''
    ? import.meta.env.DEV
      ? 'same-origin /api (Vite → 127.0.0.1:8000)'
      : 'https://api.annet.cloud'
    : API_BASE
