/** Текст черновика в чате при запросе кода приглашения (без слова VPN по правилам копирайта). */
export const SUPPORT_INVITE_REQUEST_DRAFT =
  'Здравствуйте! Прошу выдать код приглашения для доступа к подписке Annet Cloud.'

/** `https://t.me/<username>` для чата поддержки; username из VITE_SUPPORT_BOT_USERNAME (без @). */
export function supportTelegramUrl(): string | null {
  const raw = import.meta.env.VITE_SUPPORT_BOT_USERNAME as string | "@annet_support_bot"
  const u = raw?.trim().replace(/^@/, '')
  if (!u) return null
  return `https://t.me/${u}`
}

/** Ссылка на чат поддержки с черновиком сообщения (`?text=`). */
export function supportInviteRequestTelegramUrl(): string | null {
  const base = supportTelegramUrl()
  if (!base) return null
  return `${base}?text=${encodeURIComponent(SUPPORT_INVITE_REQUEST_DRAFT)}`
}

/** Собирает ссылку-приглашение: из API или из кода + VITE_BOT_USERNAME. */
export function resolveInviteLink(code: string, apiLink: string | null): string | null {
  const normalizedCode = code.trim().toUpperCase()
  const cabinetBase = (import.meta.env.VITE_CABINET_URL as string | undefined)?.trim().replace(/\/+$/, '')
  if (cabinetBase && normalizedCode && normalizedCode !== '-') {
    return `${cabinetBase}/invite/${encodeURIComponent(normalizedCode)}`
  }

  const trimmed = apiLink?.trim()
  if (trimmed) return trimmed
  const bot = import.meta.env.VITE_BOT_USERNAME as string | undefined
  if (normalizedCode && normalizedCode !== '-' && bot?.trim()) {
    return `https://t.me/${bot.replace(/^@/, '')}?start=${normalizedCode}`
  }
  return null
}
