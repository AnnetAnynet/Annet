import { useCallback, useEffect, useRef, useState } from 'react'
import { authMiniApp } from '../api/endpoints'
import { normalizeTelegramProxyUrl } from '../utils/telegramLinks'

interface TelegramUser {
  telegramId: number
  firstName: string | null
  username: string | null
  photoUrl: string | null
  /** From auth; for dev without Telegram use dashboard `is_admin` */
  isAdmin?: boolean
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name?: string
            last_name?: string
            username?: string
            photo_url?: string
          }
          start_param?: string
        }
        ready: () => void
        expand: () => void
        close: () => void
        showAlert?: (message: string, callback?: () => void) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        openTelegramLink?: (url: string) => void
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        }
        addToHomeScreen?: () => void
        themeParams: Record<string, string>
      }
    }
  }
}

function getTg() {
  return window.Telegram?.WebApp
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const tg = getTg()

    if (tg?.initData) {
      tg.ready()
      tg.expand()

      authMiniApp(tg.initData)
        .then(res => {
          setUser({
            telegramId: res.telegram_id,
            firstName: res.first_name,
            username: res.username,
            photoUrl: res.photo_url ?? null,
            isAdmin: res.is_admin === true,
          })
        })
        .catch(err => {
          console.error('Mini App auth failed:', err)
          setError('Auth failed')
          // Fallback: use initDataUnsafe (works for dev)
          const unsafeUser = tg.initDataUnsafe?.user
          if (unsafeUser) {
            setUser({
              telegramId: unsafeUser.id,
              firstName: unsafeUser.first_name ?? null,
              username: unsafeUser.username ?? null,
              photoUrl: unsafeUser.photo_url ?? null,
              isAdmin: false,
            })
          }
        })
        .finally(() => setLoading(false))
    } else {
      // Not inside Telegram - dev mode, use mock telegram_id from env
      const devId = import.meta.env.VITE_DEV_TELEGRAM_ID
      if (devId) {
        setUser({
          telegramId: Number(devId),
          firstName: 'Dev',
          username: 'dev_user',
          photoUrl: null,
          isAdmin: false,
        })
      }
      setLoading(false)
    }
  }, [])

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    getTg()?.HapticFeedback?.impactOccurred(type)
  }, [])

  const openLink = useCallback((url: string) => {
    const tg = getTg()
    if (tg) {
      tg.openLink(url)
    } else {
      window.open(url, '_blank')
    }
  }, [])

  /** Нативное «Поделиться» в Telegram (не требует inline mode у бота). */
  const shareTelegramUrl = useCallback((url: string, text?: string) => {
    const tg = getTg()
    // encodeURIComponent даёт %20 для пробелов; URLSearchParams.toString() даёт «+»,
    // из‑за чего в тексте сообщения иногда отображаются лишние «+».
    const q = `url=${encodeURIComponent(url)}${text ? `&text=${encodeURIComponent(text)}` : ''}`
    const shareLink = `https://t.me/share/url?${q}`
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareLink)
    } else if (tg?.openLink) {
      tg.openLink(shareLink)
    } else {
      window.open(shareLink, '_blank', 'noopener,noreferrer')
    }
  }, [])

  /** Открыть ссылку вида https://t.me/... внутри Telegram (бот, пользователь, группа). */
  const openTelegramUrl = useCallback((url: string) => {
    const normalized = normalizeTelegramProxyUrl(url)
    const tg = getTg()
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(normalized)
    } else if (tg?.openLink) {
      tg.openLink(normalized)
    } else {
      window.open(normalized, '_blank', 'noopener,noreferrer')
    }
  }, [])

  /**
   * MTProto: только `openTelegramLink(https://t.me/proxy?...)` - нативно в клиенте, без внешнего браузера
   * (иначе `openLink` к t.me зависает при блокировках без VPN). Вне Telegram - вкладка для отладки.
   */
  const openMtProtoProxyLink = useCallback((proxyLink: string) => {
    const normalized = normalizeTelegramProxyUrl(proxyLink)
    const tg = getTg()
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(normalized)
      return
    }
    window.open(normalized, '_blank', 'noopener,noreferrer')
  }, [])

  const startParam = getTg()?.initDataUnsafe?.start_param ?? null

  return {
    user,
    loading,
    error,
    haptic,
    openLink,
    openTelegramUrl,
    openMtProtoProxyLink,
    shareTelegramUrl,
    startParam,
  }
}
