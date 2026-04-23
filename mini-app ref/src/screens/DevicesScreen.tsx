import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Device } from '../api/types'
import { addDevice, deleteDevice, fetchDevices, renameDevice, toggleDevice } from '../api/endpoints'
import { ApiError } from '../api/client'
import { HudCard } from '../components/HudCard'
import { HudButton } from '../components/HudButton'

interface DevicesScreenProps {
  open: boolean
  onClose: () => void
  telegramId: number | null
  haptic: (type?: 'light' | 'medium' | 'heavy') => void
  onShare: (url: string, text: string) => void
  displayPlans: Array<{
    id: number
    period: string
    price: number
    listPriceRub?: number | null
    badge: string | null
    perMonth: string | null
    savingsHint?: string | null
    popular: boolean
    dataLimitGb: number | null
    maxDevices: number | null
  }>
  onSelectPlan: (planId: number) => void
  pendingDeviceConfigId?: number | null
  onDevicePaymentInitiated?: (deviceId: number | null) => void
}

/* ── Device config modal (QR + copy + share) ────────────────────── */

function DeviceConfigModal({
  device,
  onClose,
  onShare,
  haptic,
}: {
  device: Device
  onClose: () => void
  onShare: (url: string, text: string) => void
  haptic: (type?: 'light' | 'medium' | 'heavy') => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const url = device.proxy_subscription_url ?? ''

  useEffect(() => {
    let cancelled = false
    setQrDataUrl(null)
    if (!url) return

    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then((data: string) => { if (!cancelled) setQrDataUrl(data) })
      .catch(() => { if (!cancelled) setQrDataUrl(null) })

    return () => { cancelled = true }
  }, [url])

  const handleCopy = () => {
    haptic('light')
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    haptic('light')
    onShare(url, `VPN-конфиг «${device.name}» - Annet Cloud`)
  }

  return (
    <div className="fixed inset-0 z-110" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" />

      <div
        className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-bg-alt rounded-xl max-w-sm mx-auto overflow-hidden"
        style={{ animation: 'fade-in 0.15s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-5 pb-3 px-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
            <span className="w-3 h-px bg-accent" />
            {device.name}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-xs cursor-pointer hover:border-accent-border transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* QR code */}
          <div className="flex justify-center">
            <div className="w-44 h-44 bg-white rounded-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-[160px] h-[160px]" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
              )}
            </div>
          </div>

          <p className="text-[11px] text-text-dim text-center leading-relaxed">
            Отсканируйте QR-код камерой или скопируйте ссылку и вставьте в VPN-приложение.
          </p>

          {/* Subscription URL preview */}
          <div className="font-mono text-[10px] text-text-dim bg-[rgba(0,0,0,0.3)] border border-border rounded-[4px] p-2.5 break-all leading-relaxed max-h-16 overflow-y-auto">
            {url}
          </div>

          <HudButton onClick={handleCopy}>
            {copied ? '✓ Скопировано' : 'Скопировать ссылку'}
          </HudButton>

          <HudButton variant="secondary" onClick={handleShare}>
            Поделиться
          </HudButton>
        </div>
      </div>
    </div>
  )
}

function DevicePaywallModal({
  device,
  plans,
  onClose,
  onSelectPlan,
}: {
  device: Device
  plans: DevicesScreenProps['displayPlans']
  onClose: () => void
  onSelectPlan: (planId: number) => void
}) {
  return (
    <div className="fixed inset-0 z-110" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" />
      <div
        className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-bg-alt rounded-xl max-w-sm mx-auto overflow-hidden"
        style={{ animation: 'fade-in 0.15s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-5 pb-3 px-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
            <span className="w-3 h-px bg-accent" />
            {device.name}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-xs cursor-pointer hover:border-accent-border transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pb-6">
          <p className="text-xs text-text-dim leading-relaxed mb-4">
            Конфиг устройства доступен при активной подписке. Оформите подписку, и конфиг появится автоматически.
          </p>
          {plans.length > 0 ? (
            <div className="space-y-2">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onSelectPlan(plan.id)}
                  className="w-full text-left bg-bg-card border border-border-card rounded-[4px] p-3 cursor-pointer hover:border-accent-border transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-text">{plan.period}</span>
                    <span className="text-xs font-bold text-accent">{plan.price.toLocaleString('ru-RU')} руб</span>
                  </div>
                  {plan.perMonth && (
                    <div className="text-[10px] text-text-dim mt-1">{plan.perMonth}</div>
                  )}
                  {plan.savingsHint && (
                    <p className="mt-1.5 rounded-[3px] border border-accent-border/25 bg-accent-dim/35 px-1.5 py-1 text-[9px] font-medium leading-snug text-text-muted text-balance">
                      {plan.savingsHint}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-dim leading-relaxed">
              Сейчас нет подходящих тарифов для управления устройствами.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Device row ──────────────────────────────────────────────────── */

function DeviceRow({
  device,
  busy,
  onToggle,
  onRename,
  onDelete,
  onOpenConfig,
  onOpenPaywall,
}: {
  device: Device
  busy: boolean
  onToggle: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onOpenConfig: () => void
  onOpenPaywall: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(device.name)

  const handleSave = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== device.name) onRename(trimmed)
    setEditing(false)
  }

  return (
    <div className="bg-bg-card border border-border-card rounded-[4px] p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            device.is_enabled
              ? 'bg-green shadow-[0_0_8px_rgba(46,204,113,0.6)]'
              : 'bg-text-dim'
          }`}
        />

        {editing ? (
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            maxLength={64}
            autoFocus
            className="flex-1 bg-transparent border-b border-accent text-sm text-text outline-none py-0.5"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(device.name); setEditing(true) }}
            className="flex-1 text-left text-sm font-semibold text-text truncate cursor-pointer hover:text-accent transition-colors"
          >
            {device.name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={`
            flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-[3px]
            transition-colors border
            ${busy
              ? 'border-border-card text-text-dim cursor-not-allowed opacity-50'
              : device.is_enabled
                ? 'border-border-card text-text-muted hover:border-red hover:text-red cursor-pointer'
                : 'border-accent-border text-accent hover:bg-accent-dim cursor-pointer'
            }
          `}
        >
          {busy ? '...' : device.is_enabled ? 'Отключить' : 'Включить'}
        </button>

        <button
          type="button"
          onClick={device.proxy_subscription_url ? onOpenConfig : onOpenPaywall}
          disabled={busy}
          className="flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-[3px] cursor-pointer transition-colors border border-accent-border text-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Конфиг
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="py-2 px-3 text-[11px] font-bold uppercase tracking-wider rounded-[3px] transition-colors border border-border-card text-text-dim hover:border-red hover:text-red cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Main devices sheet ──────────────────────────────────────────── */

export function DevicesScreen({
  open,
  onClose,
  telegramId,
  haptic,
  onShare,
  displayPlans,
  onSelectPlan,
  pendingDeviceConfigId = null,
  onDevicePaymentInitiated,
}: DevicesScreenProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [configDevice, setConfigDevice] = useState<Device | null>(null)
  const [paywallDevice, setPaywallDevice] = useState<Device | null>(null)
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const deviceEligiblePlans = displayPlans.filter(plan => plan.dataLimitGb === null)

  const setBusy = (id: number, busy: boolean) =>
    setBusyIds(prev => { const s = new Set(prev); busy ? s.add(id) : s.delete(id); return s })

  const load = useCallback(async () => {
    if (!telegramId) return
    setLoading(true)
    try {
      const data = await fetchDevices(telegramId)
      setDevices(data.devices)
    } catch {
      setError('Не удалось загрузить устройства. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }, [telegramId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  useEffect(() => {
    if (!open) {
      setNewName('')
      setAdding(false)
      setConfigDevice(null)
      setPaywallDevice(null)
      setError(null)
      setBusyIds(new Set())
    }
  }, [open])

  useEffect(() => {
    if (!pendingDeviceConfigId) return
    const paidDevice = devices.find(
      d => d.id === pendingDeviceConfigId && Boolean(d.proxy_subscription_url),
    )
    if (!paidDevice) return
    setConfigDevice(paidDevice)
    setPaywallDevice(null)
    onDevicePaymentInitiated?.(null)
  }, [devices, onDevicePaymentInitiated, pendingDeviceConfigId])

  const handleAdd = async () => {
    if (!telegramId || !newName.trim()) return
    haptic('medium')
    setAdding(true)
    setError(null)
    try {
      const device = await addDevice(telegramId, newName.trim())
      setDevices(prev => [...prev, device])
      setNewName('')
    } catch {
      setError('Не удалось добавить устройство. Попробуйте ещё раз.')
    }
    setAdding(false)
  }

  const handleToggle = async (d: Device) => {
    if (!telegramId) return
    haptic('light')
    setBusy(d.id, true)
    setError(null)
    try {
      const updated = await toggleDevice(telegramId, d.id, !d.is_enabled)
      setDevices(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError('Изменение устройства доступно при активной подписке.')
      } else {
        setError('Не удалось изменить статус устройства. Попробуйте ещё раз.')
      }
    } finally {
      setBusy(d.id, false)
    }
  }

  const handleRename = async (d: Device, name: string) => {
    if (!telegramId) return
    setError(null)
    try {
      const updated = await renameDevice(telegramId, d.id, name)
      setDevices(prev => prev.map(x => x.id === updated.id ? updated : x))
    } catch {
      setError('Не удалось переименовать устройство.')
    }
  }

  const handleDelete = async (d: Device) => {
    if (!telegramId) return
    haptic('medium')
    setBusy(d.id, true)
    setError(null)
    try {
      await deleteDevice(telegramId, d.id)
      setDevices(prev => prev.filter(x => x.id !== d.id))
    } catch {
      setBusy(d.id, false)
      setError('Не удалось удалить устройство. Попробуйте ещё раз.')
    }
  }

  if (!open) return null

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
        <div className="sticky top-0 bg-bg-alt pt-3 pb-2 px-5 z-10">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
              <span className="w-3 h-px bg-accent" />
              Управление устройствами
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
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-[rgba(231,76,60,0.1)] border border-[rgba(231,76,60,0.3)] rounded-[4px] text-xs text-red leading-relaxed">
              {error}
            </div>
          )}

          {devices.length === 0 && !loading && (
            <HudCard tag="Зачем это нужно" className="mb-5">
              <p className="text-xs text-text-dim leading-relaxed">
                Добавьте устройство - получите отдельную VPN-ссылку для него. Если продадите или потеряете телефон - отключите его за секунду, остальные устройства продолжат работать.
              </p>
              <p className="text-xs text-text-dim leading-relaxed mt-2">
                Основная ссылка из раздела «Получить конфиг» работает как раньше - на любом количестве устройств.
              </p>
            </HudCard>
          )}

          {loading && devices.length === 0 && (
            <div className="flex justify-center py-8">
              <div
                className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            </div>
          )}

          {devices.length > 0 && (
            <div className="space-y-3 mb-5">
              {devices.map(d => (
                <DeviceRow
                  key={d.id}
                  device={d}
                  busy={busyIds.has(d.id)}
                  onToggle={() => handleToggle(d)}
                  onRename={name => handleRename(d, name)}
                  onDelete={() => handleDelete(d)}
                  onOpenConfig={() => { haptic('light'); setConfigDevice(d) }}
                  onOpenPaywall={() => {
                    haptic('light')
                    setPaywallDevice(d)
                  }}
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="Название - например, iPhone"
              maxLength={64}
              className="w-full bg-bg-card border border-border-card rounded-[4px] px-4 py-3 text-sm text-text placeholder:text-text-dim outline-none focus:border-accent-border transition-colors"
            />
            <HudButton
              variant={devices.length === 0 ? 'primary' : 'secondary'}
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
            >
              {adding ? 'Добавление...' : 'Добавить устройство'}
            </HudButton>
          </div>
        </div>
      </div>

      {configDevice && (
        <DeviceConfigModal
          device={configDevice}
          onClose={() => setConfigDevice(null)}
          onShare={onShare}
          haptic={haptic}
        />
      )}
      {paywallDevice && (
        <DevicePaywallModal
          device={paywallDevice}
          plans={deviceEligiblePlans}
          onClose={() => setPaywallDevice(null)}
          onSelectPlan={(planId) => {
            onDevicePaymentInitiated?.(paywallDevice.id)
            onSelectPlan(planId)
            setPaywallDevice(null)
          }}
        />
      )}
    </div>
  )
}
