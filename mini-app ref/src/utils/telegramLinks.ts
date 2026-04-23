/**
 * `WebApp.openTelegramLink` only accepts https://t.me/..., telegram.me, or tg://resolve - not tg://proxy.
 * MTProto links use the https://t.me/proxy?... form (same query as tg://proxy?...).
 */
export function normalizeTelegramProxyUrl(url: string): string {
  if (!url.startsWith('tg://proxy')) {
    return url
  }
  try {
    const parsed = new URL(url)
    return `https://t.me/proxy${parsed.search}`
  } catch {
    return url
  }
}
