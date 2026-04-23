import { useState } from 'react'
import { APP_META } from '../data/routingConfigs'
import { HudButton } from './HudButton'
import { api } from '../api/client'

interface SuggestConfigSheetProps {
  open: boolean
  onClose: () => void
}

const SUGGEST_APPS = ['happ', 'v2box', 'v2raytun', 'streisand'] as const

export function SuggestConfigSheet({ open, onClose }: SuggestConfigSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [deeplink, setDeeplink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleApp = (appId: string) => {
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(a => a !== appId) : [...prev, appId],
    )
  }

  const handleSubmit = async () => {
    if (!name.trim() || !deeplink.trim() || selectedApps.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      await api('/api/routing-configs/suggest', {
        method: 'POST',
        body: {
          name: name.trim(),
          description: description.trim(),
          apps: selectedApps,
          deeplink: deeplink.trim(),
        },
      })
      setSubmitted(true)
    } catch {
      setError('Не удалось отправить. Попробуйте позже.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => {
      setName('')
      setDescription('')
      setSelectedApps([])
      setDeeplink('')
      setSubmitted(false)
      setError(null)
    }, 300)
  }

  if (!open) return null

  const canSubmit = name.trim().length > 0 && deeplink.trim().length > 0 && selectedApps.length > 0

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
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
              <span className="w-3 h-px bg-accent" />
              Предложить конфиг
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-sm cursor-pointer hover:border-accent-border transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 pb-10">
          {submitted ? (
            /* === Success state === */
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="text-4xl">🦊</div>
              <div className="text-sm font-bold text-text">Отправлено!</div>
              <p className="text-xs text-text-muted leading-relaxed max-w-xs">
                Мы получили ваш конфиг и рассмотрим его. Если он подойдёт - добавим в список.
              </p>
              <HudButton onClick={handleClose}>Закрыть</HudButton>
            </div>
          ) : (
            /* === Form === */
            <>
              <p className="text-xs text-text-dim mb-5 leading-relaxed">
                Знаете полезный конфиг маршрутизации? Поделитесь - мы проверим и добавим его для всех.
              </p>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                  Название конфига
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Например: Игры без VPN"
                  className="
                    w-full bg-bg-card border border-border-card rounded-[4px] px-3 py-2.5
                    text-sm text-text placeholder:text-text-dim
                    focus:outline-none focus:border-accent-border
                    transition-[border-color] duration-150
                  "
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                  Описание <span className="normal-case font-normal opacity-60">(необязательно)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Что делает этот конфиг, для кого полезен?"
                  className="
                    w-full bg-bg-card border border-border-card rounded-[4px] px-3 py-2.5
                    text-sm text-text placeholder:text-text-dim resize-none
                    focus:outline-none focus:border-accent-border
                    transition-[border-color] duration-150
                  "
                />
              </div>

              {/* App selector */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                  Приложения
                </label>
                <div className="space-y-2">
                  {SUGGEST_APPS.map(appId => {
                    const meta = APP_META[appId]
                    if (!meta) return null
                    const selected = selectedApps.includes(appId)
                    return (
                      <button
                        key={appId}
                        type="button"
                        onClick={() => toggleApp(appId)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] border text-left
                          transition-[border-color,background] duration-150 cursor-pointer
                          ${selected
                            ? 'bg-accent-dim border-accent-border'
                            : 'bg-bg-card border-border-card hover:border-accent-border'
                          }
                        `}
                      >
                        <img src={meta.logo} alt={meta.name} className="w-6 h-6 rounded-md object-contain" />
                        <span className={`text-sm font-semibold ${selected ? 'text-accent' : 'text-text'}`}>
                          {meta.name}
                        </span>
                        <span className={`
                          ml-auto w-4 h-4 rounded-[3px] border flex items-center justify-center text-[10px]
                          transition-[border-color,background,color] duration-150
                          ${selected
                            ? 'bg-accent border-accent text-white'
                            : 'bg-transparent border-border-card text-transparent'
                          }
                        `}>
                          ✓
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Deeplink / code */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                  Ссылка / код конфига
                </label>
                <textarea
                  value={deeplink}
                  onChange={e => setDeeplink(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  placeholder="happ://routing/add/... или v2box://routes?single=..."
                  className="
                    w-full bg-bg-card border border-border-card rounded-[4px] px-3 py-2.5
                    text-[11px] font-mono text-text-muted placeholder:text-text-dim resize-none
                    focus:outline-none focus:border-accent-border
                    transition-[border-color] duration-150 break-all leading-relaxed
                  "
                />
              </div>

              {error && (
                <div className="mb-4 text-xs text-red font-semibold text-center">{error}</div>
              )}

              <HudButton
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                style={{ opacity: !canSubmit || submitting ? 0.5 : 1 }}
              >
                {submitting ? 'Отправка...' : 'Отправить'}
              </HudButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
