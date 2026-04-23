import { useState } from 'react'
import type { ActivateResult } from '../api/types'

interface ActivationBannerProps {
  result: ActivateResult
  onDismiss: () => void
  onTrial?: () => void
  hasTrialAvailable?: boolean
}

function slotsLabel(slots: number | null): string {
  if (slots === null || slots === undefined) return ''
  if (slots === 0) return ' - все места заняты'
  if (slots % 10 === 1 && slots % 100 !== 11) return ` - осталось ${slots} место`
  if (slots % 10 >= 2 && slots % 10 <= 4 && (slots % 100 < 10 || slots % 100 >= 20))
    return ` - осталось ${slots} места`
  return ` - осталось ${slots} мест`
}

export function ActivationBanner({
  result,
  onDismiss,
  onTrial,
  hasTrialAvailable,
}: ActivationBannerProps) {
  const [trialLoading, setTrialLoading] = useState(false)

  const handleTrial = async () => {
    if (!onTrial) return
    setTrialLoading(true)
    await onTrial()
    setTrialLoading(false)
  }

  const isStartCode = result.source === 'start_code'
  const isReferral = result.source === 'referral'
  const wasNew = result.activated

  let tag: string
  let heading: string
  let body: string

  if (isStartCode && wasNew) {
    tag = 'стартовый код'
    heading = 'Стартовый код принят'
    body = `Доступ открыт${slotsLabel(result.start_code_remaining_slots)}.`
  } else if (isReferral && wasNew) {
    tag = 'приглашение'
    heading = 'Доступ открыт по приглашению'
    body = 'Пробный период и оплата уже доступны.'
  } else {
    tag = 'доступ'
    heading = 'Код уже был активирован'
    body = 'Доступ действует.'
  }

  return (
    <div className="relative bg-bg-card border border-accent-glow rounded-[4px] p-4 overflow-hidden mb-4">
      {/* Corner brackets */}
      <i className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent" />
      <i className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent" />

      {/* Tag */}
      <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
        <span className="w-3 h-px bg-accent" />
        {tag}
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text leading-snug">{heading}</p>
          <p className="text-xs text-text-muted mt-0.5">{body}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-text-dim hover:text-text-muted text-lg leading-none mt-0.5 cursor-pointer"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      {/* Trial CTA - shown only when newly activated and trial is available */}
      {wasNew && result.has_access && hasTrialAvailable && onTrial && (
        <button
          type="button"
          onClick={handleTrial}
          disabled={trialLoading}
          className="mt-3 w-full py-2 bg-accent text-white text-xs font-bold tracking-[0.06em] uppercase rounded-[3px] cursor-pointer disabled:opacity-60"
        >
          {trialLoading ? 'Активация...' : 'Бесплатный доступ'}
        </button>
      )}
    </div>
  )
}
