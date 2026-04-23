import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchCitySuggestions, submitIncidentReport } from '../api/endpoints'
import type { CitySuggestion } from '../api/types'
import { HudButton } from './HudButton'

type ServiceType = 'vpn' | 'mtproto'
type ConnectionType = 'mobile' | 'wifi' | 'both'

const PROVIDERS = ['Билайн', 'МТС', 'Мегафон', 'Теле2', 'Yota', 'T-Mobile', 'Другое'] as const

interface IncidentReportSheetProps {
  open: boolean
  onClose: () => void
  telegramId: number | null
  supportUrl?: string | null
}

type Step = 'service' | 'connection' | 'provider' | 'city' | 'support'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function IncidentReportSheet({ open, onClose, telegramId, supportUrl }: IncidentReportSheetProps) {
  // Wizard state - persists across support navigation
  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<ServiceType | null>(null)
  const [connection, setConnection] = useState<ConnectionType | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [providerCustom, setProviderCustom] = useState('')
  const [city, setCity] = useState('')
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cityInputRef = useRef<HTMLInputElement>(null)
  const debouncedCity = useDebounce(city, 350)

  // Load city suggestions
  useEffect(() => {
    if (debouncedCity.length < 2) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    let cancelled = false
    setSuggestionsLoading(true)
    fetchCitySuggestions(debouncedCity)
      .then(data => {
        if (!cancelled) {
          setSuggestions(data)
          setSuggestOpen(data.length > 0)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSuggestionsLoading(false) })
    return () => { cancelled = true }
  }, [debouncedCity])

  const resetForm = () => {
    setStep('service')
    setService(null)
    setConnection(null)
    setProvider(null)
    setProviderCustom('')
    setCity('')
    setSuggestions([])
    setSuggestOpen(false)
    setSubmitting(false)
    setSubmitted(false)
    setError(null)
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }

  // Step navigation
  const goNextFromService = (s: ServiceType) => {
    setService(s)
    if (s === 'mtproto') {
      setConnection(null)
      setProvider(null)
      setStep('city')
    } else {
      setStep('connection')
    }
  }

  const goNextFromConnection = (c: ConnectionType) => {
    setConnection(c)
    if (c === 'wifi') {
      setProvider(null)
      setStep('city')
    } else {
      setStep('provider')
    }
  }

  const goNextFromProvider = (p: string) => {
    setProvider(p)
    if (p !== 'Другое') setProviderCustom('')
    setStep('city')
  }

  const goPrev = () => {
    if (step === 'connection') { setStep('service'); return }
    if (step === 'provider') { setStep('connection'); return }
    if (step === 'city') {
      if (service === 'mtproto') setStep('service')
      else if (connection === 'wifi') setStep('connection')
      else setStep('provider')
      return
    }
    if (step === 'support') setStep('city')
  }

  const handleSubmit = async () => {
    if (!service) return
    setSubmitting(true)
    setError(null)
    try {
      const finalProvider =
        provider === 'Другое' && providerCustom.trim()
          ? providerCustom.trim()
          : provider !== 'Другое'
          ? provider
          : null

      await submitIncidentReport({
        telegram_id: telegramId ?? undefined,
        service_type: service,
        connection_type: connection ?? undefined,
        provider: finalProvider ?? undefined,
        city: city.trim() || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Не удалось отправить отчёт. Попробуйте позже.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenSupport = () => {
    if (!supportUrl) return
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) tg.openTelegramLink(supportUrl)
    else window.open(supportUrl, '_blank')
  }

  if (!open) return null

  const STEP_LABELS: Record<Step, string> = {
    service: 'Что не работает',
    connection: 'Тип подключения',
    provider: 'Провайдер',
    city: 'Город',
    support: 'Перед отправкой',
  }

  const canGoBack = step !== 'service'

  return (
    <div className="fixed inset-0 z-100">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease' }}
        onClick={handleClose}
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
              {canGoBack && !submitted && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="text-text-muted text-sm cursor-pointer hover:text-accent transition-colors"
                >
                  ←
                </button>
              )}
              <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
                <span className="w-3 h-px bg-accent" />
                {submitted ? 'Отчёт отправлен' : STEP_LABELS[step]}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-sm cursor-pointer hover:border-accent-border transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Step progress dots */}
          {!submitted && (
            <div className="flex gap-1.5 mt-3 justify-center">
              {(['service', 'connection', 'provider', 'city', 'support'] as Step[]).map((s, i) => {
                // Determine which steps are relevant for this report
                const relevant =
                  service === 'mtproto'
                    ? ['service', 'city', 'support']
                    : connection === 'wifi'
                    ? ['service', 'connection', 'city', 'support']
                    : ['service', 'connection', 'provider', 'city', 'support']

                if (!relevant.includes(s)) return null
                const idx = relevant.indexOf(s)
                const currentIdx = relevant.indexOf(step)
                const isDone = idx < currentIdx
                const isCurrent = s === step

                return (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-200 ${
                      isCurrent
                        ? 'w-4 bg-accent'
                        : isDone
                        ? 'w-2 bg-accent opacity-50'
                        : 'w-2 bg-[rgba(255,255,255,0.15)]'
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-10 pt-2">
          {submitted ? (
            <SuccessState onClose={handleClose} />
          ) : step === 'service' ? (
            <ServiceStep onSelect={goNextFromService} selected={service} />
          ) : step === 'connection' ? (
            <ConnectionStep onSelect={goNextFromConnection} selected={connection} />
          ) : step === 'provider' ? (
            <ProviderStep
              onSelect={goNextFromProvider}
              selected={provider}
              customValue={providerCustom}
              onCustomChange={setProviderCustom}
            />
          ) : step === 'city' ? (
            <CityStep
              city={city}
              onChange={(v) => { setCity(v); setSuggestOpen(false) }}
              suggestions={suggestions}
              suggestionsLoading={suggestionsLoading}
              suggestOpen={suggestOpen}
              onSuggestionPick={(v) => { setCity(v); setSuggestions([]); setSuggestOpen(false) }}
              inputRef={cityInputRef}
              onNext={() => setStep('support')}
            />
          ) : step === 'support' ? (
            <SupportStep
              onSupport={supportUrl ? handleOpenSupport : undefined}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-step components ────────────────────────────────────────────────

function ServiceStep({ onSelect, selected }: { onSelect: (s: ServiceType) => void; selected: ServiceType | null }) {
  const options: { id: ServiceType; label: string; desc: string }[] = [
    { id: 'vpn', label: 'VPN', desc: 'Приложения Happ, V2Box, Streisand и другие' },
    { id: 'mtproto', label: 'MTProto прокси', desc: 'Встроенный прокси Telegram' },
  ]

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-text-dim leading-relaxed mb-4">
        Выберите, что именно перестало работать.
      </p>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onSelect(opt.id)}
          className={`
            w-full text-left px-4 py-3.5 rounded-[4px] border cursor-pointer
            transition-[border-color,background] duration-150
            ${selected === opt.id
              ? 'bg-accent-dim border-accent-border'
              : 'bg-bg-card border-border-card hover:border-accent-border'
            }
          `}
        >
          <div className={`text-sm font-bold ${selected === opt.id ? 'text-accent' : 'text-text'}`}>
            {opt.label}
          </div>
          <div className="text-[11px] text-text-dim mt-0.5 leading-relaxed">{opt.desc}</div>
        </button>
      ))}
    </div>
  )
}

function ConnectionStep({ onSelect, selected }: { onSelect: (c: ConnectionType) => void; selected: ConnectionType | null }) {
  const options: { id: ConnectionType; label: string }[] = [
    { id: 'mobile', label: 'Мобильный интернет' },
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'both', label: 'Оба варианта' },
  ]

  return (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-text-dim leading-relaxed mb-4">
        Через какое подключение не работает VPN?
      </p>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onSelect(opt.id)}
          className={`
            w-full text-left px-4 py-3.5 rounded-[4px] border cursor-pointer
            transition-[border-color,background] duration-150
            ${selected === opt.id
              ? 'bg-accent-dim border-accent-border'
              : 'bg-bg-card border-border-card hover:border-accent-border'
            }
          `}
        >
          <span className={`text-sm font-semibold ${selected === opt.id ? 'text-accent' : 'text-text'}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

interface ProviderStepProps {
  onSelect: (p: string) => void
  selected: string | null
  customValue: string
  onCustomChange: (v: string) => void
}

function ProviderStep({ onSelect, selected, customValue, onCustomChange }: ProviderStepProps) {
  return (
    <div className="pt-2">
      <p className="text-xs text-text-dim leading-relaxed mb-4">
        Выберите вашего мобильного провайдера.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PROVIDERS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={`
              text-center px-3 py-2.5 rounded-[4px] border cursor-pointer text-sm font-semibold
              transition-[border-color,background] duration-150
              ${selected === p
                ? 'bg-accent-dim border-accent-border text-accent'
                : 'bg-bg-card border-border-card text-text hover:border-accent-border'
              }
            `}
          >
            {p}
          </button>
        ))}
      </div>
      {selected === 'Другое' && (
        <input
          type="text"
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder="Название провайдера"
          maxLength={64}
          className="
            w-full bg-bg-card border border-border-card rounded-[4px] px-3 py-2.5
            text-sm text-text placeholder:text-text-dim
            focus:outline-none focus:border-accent-border
            transition-[border-color] duration-150
          "
          autoFocus
        />
      )}
      {selected && (selected !== 'Другое' || customValue.trim()) && (
        <div className="mt-4">
          <HudButton onClick={() => onSelect(selected)}>Продолжить</HudButton>
        </div>
      )}
    </div>
  )
}

interface CityStepProps {
  city: string
  onChange: (v: string) => void
  suggestions: CitySuggestion[]
  suggestionsLoading: boolean
  suggestOpen: boolean
  onSuggestionPick: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onNext: () => void
}

interface SuggestDropdownLayout {
  left: number
  width: number
  bottom: number
  maxHeight: number
}

function CityStep({ city, onChange, suggestions, suggestionsLoading, suggestOpen, onSuggestionPick, inputRef, onNext }: CityStepProps) {
  const [layout, setLayout] = useState<SuggestDropdownLayout | null>(null)

  const updateSuggestLayout = useCallback(() => {
    const el = inputRef.current
    if (!el || !suggestOpen || suggestions.length === 0) {
      setLayout(null)
      return
    }
    const rect = el.getBoundingClientRect()
    const topMargin = 8
    const gap = 6
    const maxPreferred = Math.min(window.innerHeight * 0.4, 14 * 16)
    const spaceAbove = Math.max(0, rect.top - topMargin - gap)
    const maxHeight = Math.min(maxPreferred, spaceAbove)
    if (maxHeight < 1) {
      setLayout(null)
      return
    }
    setLayout({
      left: rect.left,
      width: rect.width,
      bottom: window.innerHeight - rect.top + gap,
      maxHeight,
    })
  }, [inputRef, suggestOpen, suggestions.length])

  useLayoutEffect(() => {
    updateSuggestLayout()
  }, [updateSuggestLayout, suggestions, suggestionsLoading])

  useEffect(() => {
    if (!suggestOpen || suggestions.length === 0) return
    updateSuggestLayout()
    const ro = new ResizeObserver(() => updateSuggestLayout())
    if (inputRef.current) ro.observe(inputRef.current)
    window.addEventListener('resize', updateSuggestLayout)
    document.addEventListener('scroll', updateSuggestLayout, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateSuggestLayout)
      document.removeEventListener('scroll', updateSuggestLayout, true)
    }
  }, [suggestOpen, suggestions.length, updateSuggestLayout, inputRef])

  const suggestPortal =
    suggestOpen && suggestions.length > 0 && layout
      ? createPortal(
          <div
            role="listbox"
            className="overflow-y-auto overscroll-contain bg-bg-alt border border-border-card rounded-[4px] shadow-lg"
            style={{
              position: 'fixed',
              left: layout.left,
              width: layout.width,
              bottom: layout.bottom,
              maxHeight: layout.maxHeight,
              zIndex: 200,
            }}
          >
            {suggestionsLoading && (
              <div className="px-3 py-2 text-[11px] text-text-dim">Поиск...</div>
            )}
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                role="option"
                onClick={() => onSuggestionPick(s.value)}
                className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-[rgba(213,96,0,0.08)] cursor-pointer border-b border-[rgba(255,255,255,0.05)] last:border-0 transition-colors shrink-0"
              >
                {s.value}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <div className="pt-2">
      <p className="text-xs text-text-dim leading-relaxed mb-1">
        Укажите ближайший крупный город - не нужно искать свой посёлок или деревню.
      </p>
      <p className="text-[10px] text-text-dim opacity-60 mb-4">Необязательно</p>

      <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
        Город
      </label>
      <input
        ref={inputRef}
        type="text"
        value={city}
        onChange={e => onChange(e.target.value)}
        placeholder="Например: Москва"
        maxLength={128}
        className="
            w-full bg-bg-card border border-border-card rounded-[4px] px-3 py-2.5
            text-sm text-text placeholder:text-text-dim
            focus:outline-none focus:border-accent-border
            transition-[border-color] duration-150
          "
      />

      {suggestPortal}

      <div className="mt-6">
        <HudButton onClick={onNext}>Продолжить</HudButton>
      </div>
    </div>
  )
}

interface SupportStepProps {
  onSupport?: () => void
  onSubmit: () => Promise<void>
  submitting: boolean
  error: string | null
}

function SupportStep({ onSupport, onSubmit, submitting, error }: SupportStepProps) {
  return (
    <div className="pt-2">
      <div className="bg-bg-card border border-[rgba(213,96,0,0.18)] rounded-[4px] p-4 mb-5">
        <div className="text-sm font-bold text-text mb-2">Сначала - в поддержку?</div>
        <p className="text-xs text-text-dim leading-relaxed">
          Возможно, мы уже знаем о проблеме и работаем над ней. Напишите нам - ответим быстро.
        </p>
      </div>

      {onSupport && (
        <div className="mb-3">
          <HudButton variant="secondary" onClick={onSupport}>
            Написать в поддержку
          </HudButton>
        </div>
      )}

      {error && (
        <div className="mb-3 text-xs text-red font-semibold text-center">{error}</div>
      )}

      <HudButton
        onClick={onSubmit}
        disabled={submitting}
        style={{ opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? 'Отправка...' : 'Отправить отчёт о сбое'}
      </HudButton>
    </div>
  )
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="text-4xl">🦊</div>
      <div className="text-sm font-bold text-text">Отчёт отправлен!</div>
      <p className="text-xs text-text-muted leading-relaxed max-w-xs">
        Спасибо - ваш отчёт поможет нам быстрее обнаружить и устранить проблему.
      </p>
      <HudButton onClick={onClose}>Закрыть</HudButton>
    </div>
  )
}
