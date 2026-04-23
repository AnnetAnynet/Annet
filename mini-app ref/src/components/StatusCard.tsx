import type { SubStatus } from '../App'
import { HudCard } from './HudCard'
import { HudButton } from './HudButton'

interface StatusCardProps {
  status: SubStatus
  isTrial: boolean
  daysLeft: number
  hoursLeft: number
  totalDays: number
  expiresAt: string
  onGetConfig: () => void
  onRenew: () => void
  dataLimitGb?: number | null
  dataUsedGb?: number | null
}

function formatRemaining(days: number, hours: number): string {
  if (days > 0) return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`
  if (hours > 0) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`
  return 'менее часа'
}

function formatGb(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1024)} МБ`
  return `${gb.toFixed(1).replace('.0', '')} ГБ`
}

export function StatusCard({
  status,
  isTrial,
  daysLeft,
  hoursLeft,
  totalDays,
  expiresAt,
  onGetConfig,
  onRenew,
  dataLimitGb,
  dataUsedGb,
}: StatusCardProps) {
  const isActive = status === 'active'
  const progress = totalDays > 0 ? Math.round((daysLeft / totalDays) * 100) : 0

  const hasTrafficLimit = isActive && dataLimitGb != null
  const trafficUsed = dataUsedGb ?? 0
  const trafficProgress = hasTrafficLimit
    ? Math.min(100, Math.round((trafficUsed / dataLimitGb!) * 100))
    : 0
  const trafficNearLimit = trafficProgress >= 80

  const statusLabel = !isActive
    ? 'Истекла'
    : isTrial
      ? 'Триал'
      : 'Активна'

  const statusDotClass = !isActive
    ? 'bg-red shadow-[0_0_10px_rgba(231,76,60,0.7)]'
    : isTrial
      ? 'bg-accent shadow-[0_0_10px_rgba(213,96,0,0.65)]'
      : 'bg-green shadow-[0_0_10px_rgba(46,204,113,0.7)]'

  const statusTextClass = !isActive
    ? 'text-red'
    : isTrial
      ? 'text-accent'
      : 'text-green'

  return (
    <div className="space-y-4">
      <HudCard serial="01" tag="Статус защиты">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`w-2 h-2 rounded-full ${statusDotClass}`}
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          <span className={`text-sm font-bold tracking-[0.04em] uppercase ${statusTextClass}`}>
            {statusLabel}
          </span>
        </div>
        {isActive && isTrial ? (
          <p className="text-[11px] text-text-dim leading-snug -mt-1 mb-3">
            Тестовый период. После окончания оформите подписку, чтобы сохранить доступ.
          </p>
        ) : null}

        {/* Days progress bar */}
        <div className="mb-1.5">
          <div className="w-full h-1.5 bg-border-card rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: isActive
                  ? 'linear-gradient(90deg, #D56000, #f07820)'
                  : 'linear-gradient(90deg, #e74c3c, #c0392b)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-text-dim">
            <span>{isActive ? formatRemaining(daysLeft, hoursLeft) : 'менее часа'}</span>
            <span>{isActive ? `до ${expiresAt}` : 'подписка завершена'}</span>
          </div>
        </div>

        {/* Traffic progress bar - Solo plan only */}
        {hasTrafficLimit && (
          <div className="mt-3 pt-3 border-t border-border-card">
            <div className="flex justify-between mb-1 text-[10px] font-bold uppercase tracking-[0.06em]">
              <span className="text-text-dim">Трафик</span>
              <span className={trafficNearLimit ? 'text-red' : 'text-text-dim'}>
                {formatGb(trafficUsed)} / {formatGb(dataLimitGb!)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-border-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${trafficProgress}%`,
                  background: trafficNearLimit
                    ? 'linear-gradient(90deg, #e74c3c, #c0392b)'
                    : 'linear-gradient(90deg, #3498db, #2980b9)',
                }}
              />
            </div>
            {trafficNearLimit && (
              <p className="mt-1 text-[10px] text-red leading-snug">
                {trafficProgress >= 100
                  ? 'Лимит исчерпан - трафик приостановлен до следующего месяца'
                  : 'Лимит почти исчерпан'}
              </p>
            )}
          </div>
        )}
      </HudCard>

      {isActive ? (
        <HudButton onClick={onGetConfig}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          Получить конфиг
        </HudButton>
      ) : (
        <HudButton onClick={onRenew}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Продлить доступ
        </HudButton>
      )}
    </div>
  )
}
