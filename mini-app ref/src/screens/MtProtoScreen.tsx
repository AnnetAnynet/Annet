import { useCallback, useEffect, useRef, useState } from 'react'
import { HudButton } from '../components/HudButton'
import { ProxyConnectSheet } from '../components/ProxyConnectSheet'
import type { MtProtoProxyStats, MtProtoServerPublic, SupportContext, SupportPaymentStatus } from '../api/types'
import { fetchMtProtoProxyStats, fetchMtProtoServers } from '../api/endpoints'

/** Keep in sync with backend `mtproto_stats_refresh_interval_seconds` (default 60). */
const MTPROTO_STATS_POLL_MS = 360_000

interface MtProtoScreenProps {
  onSupport: () => void
  haptic: (type?: 'light' | 'medium' | 'heavy') => void
  openMtProtoProxyLink: (proxyLink: string) => void
  supportContext: SupportContext | null
  supportPaymentStatus: SupportPaymentStatus | null
  onDismissPaymentStatus: () => void
  onShare: (url: string, text: string) => void
}

export function MtProtoScreen({
  onSupport,
  haptic,
  openMtProtoProxyLink,
  supportContext,
  supportPaymentStatus,
  onDismissPaymentStatus,
  onShare,
}: MtProtoScreenProps) {
  const [servers, setServers] = useState<MtProtoServerPublic[]>([])
  const [proxySheetOpen, setProxySheetOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [proxyStats, setProxyStats] = useState<MtProtoProxyStats | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchMtProtoServers()
      .then(setServers)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const load = () => {
      fetchMtProtoProxyStats()
        .then(setProxyStats)
        .catch(() => {})
    }
    load()
    intervalRef.current = setInterval(load, MTPROTO_STATS_POLL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleOpenProxySheet = useCallback(() => {
    haptic('light')
    setProxySheetOpen(true)
  }, [haptic])

  const handleCopyPromo = useCallback((code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    haptic('medium')
    setTimeout(() => setCopied(false), 2000)
  }, [haptic])

  const bonusLabel = supportContext?.bonus_label ?? '+14 дней VPN в подарок'

  if (supportPaymentStatus && supportPaymentStatus.status === 'paid') {
    return (
      <ThankYouScreen
        paymentStatus={supportPaymentStatus}
        onCopyPromo={handleCopyPromo}
        copied={copied}
        onBack={onDismissPaymentStatus}
        onShare={onShare}
        haptic={haptic}
      />
    )
  }

  return (
    <>
      <div
        className="relative flex flex-col items-center justify-center px-5 text-center mt-8"
      >
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src="/assets/mtproto-bg.webp"
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(8,16,32,0.85) 0%, rgba(8,16,32,0.95) 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-white leading-tight mb-2">
              Бесплатные MTProto-прокси<br />для Telegram
            </h1>
          </div>

          {/* Stats */}
          <div className="w-full">
            {proxyStats !== null && proxyStats.current_time > 0 && (
              <p className="text-[10px] text-[#5a7399] mb-2 text-center opacity-90">
                Актуально на{' '}
                {new Date(proxyStats.current_time * 1000).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            <div className="flex gap-3 w-full">
              <StatCard
                value={proxyStats !== null ? String(proxyStats.ext_connections) : '-'}
                label="онлайн прямо сейчас"
                live
              />
              <StatCard value="4" label="серверов работает" />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-[#8ba4c8]">
            Работают даже при ограничениях в белых списках. Бесплатно.
          </p>

          {/* Support card */}
          <div
            className="w-full rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-sm font-semibold text-white mb-1">
              Поддержать · 99 руб
            </div>
            <div className="text-xs text-[#8ba4c8] mb-4">
              {bonusLabel}
            </div>
            <button
              type="button"
              onClick={() => { haptic('medium'); onSupport() }}
              className="w-full py-3 rounded-lg text-sm font-bold text-white cursor-pointer active:opacity-80 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #3a6fc4 0%, #4a8fd4 100%)',
              }}
            >
              Поддержать
            </button>
            <div className="text-[10px] text-[#6b85a8] mt-2">Добровольно</div>
          </div>

          {/* Connect button */}
          <button
            type="button"
            onClick={handleOpenProxySheet}
            className="flex items-center gap-2 text-sm text-[#4a7fcc] font-semibold cursor-pointer active:opacity-70 transition-opacity"
          >
            Подключиться к прокси
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      <ProxyConnectSheet
        open={proxySheetOpen}
        onClose={() => setProxySheetOpen(false)}
        servers={servers}
        onConnectProxy={(proxyLink) => {
          haptic('light')
          openMtProtoProxyLink(proxyLink)
        }}
      />
    </>
  )
}

function ThankYouScreen({
  paymentStatus,
  onCopyPromo,
  copied,
  onBack,
  onShare,
  haptic,
}: {
  paymentStatus: SupportPaymentStatus
  onCopyPromo: (code: string) => void
  copied: boolean
  onBack: () => void
  onShare: (url: string, text: string) => void
  haptic: (type?: 'light' | 'medium' | 'heavy') => void
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center px-5 text-center"
      style={{ minHeight: 'calc(100vh - 56px)' }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/assets/mtproto-bg.webp"
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(8,16,32,0.85) 0%, rgba(8,16,32,0.95) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
        <div className="text-4xl">✓</div>
        <h1 className="text-xl font-bold text-white leading-tight">
          Спасибо за поддержку!
        </h1>

        {paymentStatus.bonus_type === 'extend' && (
          <div
            className="w-full rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-sm text-[#8ba4c8] mb-1">Ваша VPN-подписка продлена</div>
            <div className="text-2xl font-extrabold text-white">
              +{paymentStatus.bonus_days} дней
            </div>
          </div>
        )}

        {paymentStatus.bonus_type === 'promo_code' && paymentStatus.promo_code && (
          <div
            className="w-full rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-sm text-[#8ba4c8] mb-2">
              Промокод на {paymentStatus.bonus_days} дней VPN
            </div>
            <div className="text-xl font-mono font-bold text-white tracking-wider mb-3">
              {paymentStatus.promo_code}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => onCopyPromo(paymentStatus.promo_code!)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white cursor-pointer active:opacity-80 transition-opacity w-full"
                style={{
                  background: copied
                    ? 'rgba(74,127,204,0.3)'
                    : 'linear-gradient(135deg, #3a6fc4 0%, #4a8fd4 100%)',
                }}
              >
                {copied ? 'Скопировано' : 'Скопировать'}
              </button>
              <HudButton
                variant="secondary"
                onClick={() => {
                  haptic('light')
                  onShare(
                    '',
                    `Промокод Annet Cloud на ${paymentStatus.bonus_days} дней VPN: ${paymentStatus.promo_code}`,
                  )
                }}
              >
                Поделиться
              </HudButton>
            </div>
            <div className="text-[11px] text-[#6b85a8] mt-3">
              Активируйте в Mini App или отправьте другу
            </div>
          </div>
        )}

        {paymentStatus.bonus_type === 'none' && (
          <p className="text-sm text-[#8ba4c8]">
            Ваша поддержка помогает работе бесплатных MTProto-прокси.
          </p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-6 py-3 rounded-lg text-sm font-semibold text-[#6b85a8] cursor-pointer active:opacity-70 transition-opacity"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Вернуться
        </button>
      </div>
    </div>
  )
}

function StatCard({ value, label, live }: { value: string; label: string; live?: boolean }) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-2xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-[10px] text-[#8ba4c8] leading-tight">{label}</div>
      {live && (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: '0 0 4px #34d399' }}
          />
          <span className="text-[9px] text-emerald-400 font-medium tracking-wide">LIVE</span>
        </div>
      )}
    </div>
  )
}
