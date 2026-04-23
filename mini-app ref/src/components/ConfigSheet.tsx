import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { HudCard } from './HudCard'
import { HudButton } from './HudButton'

interface ConfigSheetProps {
  open: boolean
  onClose: () => void
  subscriptionUrl: string
}

import { API_BASE } from '../api/apiBase'

function buildDeeplink(appId: string, subscriptionUrl: string): string | null {
  const profileName = encodeURIComponent('Annet_Cloud')
  const encodedUrl = encodeURIComponent(subscriptionUrl)

  switch (appId) {
    case 'streisand':
      return `streisand://import/${subscriptionUrl}#Annet_Cloud`
    case 'v2box':
      return `v2box://install-sub?url=${encodedUrl}&name=${profileName}`
    case 'happ':
      return `happ://add/${subscriptionUrl}`
    default:
      return null
  }
}

function buildDeeplinkOpenUrl(subscriptionUrl: string, deeplinkUrl: string): string {
  const encodedTarget = encodeURIComponent(deeplinkUrl)
  const encodedSub = encodeURIComponent(subscriptionUrl)
  return `${API_BASE}/api/vpn/deeplink/open?target=${encodedTarget}&sub=${encodedSub}`
}

const APPS = [
  { id: 'happ', name: 'Happ', logo: '/assets/happ-plus-logo.png', recommended: true },
  { id: 'v2raytun', name: 'V2RayTun', logo: '/assets/v2raytun-logo.png', recommended: false },
  { id: 'v2box', name: 'V2Box', logo: '/assets/v2box-logo.png', recommended: false },
  { id: 'streisand', name: 'Streisand', logo: '/assets/streisand-logo.png', recommended: false },
]

export function ConfigSheet({ open, onClose, subscriptionUrl }: ConfigSheetProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const deeplinkUrl = selectedAppId && subscriptionUrl
    ? buildDeeplink(selectedAppId, subscriptionUrl)
    : null

  useEffect(() => {
    let cancelled = false
    setQrDataUrl(null)

    const value = deeplinkUrl?.trim()
    if (!value) return

    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then((url: string) => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl(null) })

    return () => { cancelled = true }
  }, [deeplinkUrl])

  useEffect(() => {
    if (!open) {
      setSelectedAppId(null)
      setCopied(false)
      setQrDataUrl(null)
    }
  }, [open])

  if (!open) return null

  const selectedApp = APPS.find(a => a.id === selectedAppId)

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId)
  }

  const handleOpenInApp = () => {
    if (!deeplinkUrl || !subscriptionUrl) return
    const openUrl = buildDeeplinkOpenUrl(subscriptionUrl, deeplinkUrl)
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.openLink(openUrl)
    } else {
      window.open(openUrl, '_blank')
    }
  }

  const handleBack = () => {
    setSelectedAppId(null)
    setQrDataUrl(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(subscriptionUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-100">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease' }}
        onClick={onClose}
      />

      <div
        className="absolute bottom-0 left-0 right-0 bg-bg-alt rounded-t-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Handle + header */}
        <div className="sticky top-0 bg-bg-alt pt-3 pb-2 px-5 z-10">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedAppId && (
                <button
                  onClick={handleBack}
                  className="text-text-muted text-sm cursor-pointer hover:text-accent transition-colors"
                >
                  ←
                </button>
              )}
              <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
                <span className="w-3 h-px bg-accent" />
                {selectedAppId ? selectedApp?.name : 'Выберите приложение'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-sm cursor-pointer hover:border-accent-border transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 pb-10">
          {!selectedAppId ? (
            /* === Step 1: App selection === */
            <>
              <p className="text-xs text-text-dim mb-4 leading-relaxed">
                Выберите приложение, в котором хотите открыть конфигурацию. QR-код будет настроен для выбранного клиента.
              </p>

              <div className="space-y-2 mb-5">
                {APPS.map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    className={`
                      relative w-full flex items-center gap-3 py-3 px-4
                      bg-bg-card rounded-[4px] cursor-pointer text-left
                      transition-[border-color,transform] duration-200
                      hover:-translate-y-0.5 active:scale-[0.98]
                      ${app.recommended
                        ? 'border border-accent-border hover:border-[rgba(213,96,0,0.5)]'
                        : 'border border-border-card hover:border-accent-border'
                      }
                    `}
                  >
                    <img
                      src={app.logo}
                      alt={app.name}
                      className="w-8 h-8 rounded-lg object-contain shrink-0"
                    />
                    <span className="text-sm font-semibold text-text">{app.name}</span>
                    {app.recommended && (
                      <span className="ml-auto text-[9px] font-bold tracking-[0.06em] uppercase text-accent bg-accent-dim border border-accent-border rounded-[3px] px-2 py-0.5">
                        Рекомендуем
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Raw subscription URL copy */}
              <HudCard serial="CFG">
                <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
                  <span className="w-3 h-px bg-accent" />
                  Ссылка подписки
                </div>
                <div className="font-mono text-[11px] text-text-muted bg-[rgba(0,0,0,0.3)] border border-border rounded-[4px] p-3 break-all leading-relaxed mb-3">
                  {subscriptionUrl || 'Загрузка...'}
                </div>
                <HudButton variant="secondary" onClick={handleCopy}>
                  {copied ? '✓ Скопировано' : 'Скопировать ссылку'}
                </HudButton>
              </HudCard>
            </>
          ) : (
            /* === Step 2: QR + open button for selected app === */
            <>
              {/* QR Code with deeplink */}
              <div className="flex justify-center py-5">
                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR code" className="w-[170px] h-[170px]" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />
                  )}
                  {selectedApp && (
                    <img
                      src={selectedApp.logo}
                      alt={selectedApp.name}
                      className="absolute w-9 h-9 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4)] bg-white p-0.5"
                    />
                  )}
                </div>
              </div>

              <p className="text-xs text-text-dim text-center mb-4 leading-relaxed">
                Отсканируйте QR-код камерой с другого устройства, чтобы открыть конфигурацию в {selectedApp?.name}.
              </p>

              {/* Open in app button */}
              <HudButton onClick={handleOpenInApp} className="mb-4">
                Открыть в {selectedApp?.name}
              </HudButton>

              {/* Copy raw link fallback */}
              <HudButton variant="secondary" onClick={handleCopy}>
                {copied ? '✓ Скопировано' : 'Скопировать ссылку подписки'}
              </HudButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
