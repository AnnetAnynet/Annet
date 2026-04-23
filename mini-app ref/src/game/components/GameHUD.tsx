import { MAX_HEALTH } from '../engine/constants'

function HealthHud({ health }: { health: number }) {
  const critical = health === 1 && health > 0

  return (
    <div
      className={`relative w-23 overflow-hidden rounded-[3px] border bg-bg-card/95 px-2.5 py-1.5 ${
        critical
          ? 'border-red/45 shadow-[0_0_18px_rgba(231,76,60,0.28)]'
          : 'border-accent/35 shadow-[0_0_16px_rgba(213,96,0,0.12)]'
      }`}
      role="status"
      aria-label={`Прочность ${health} из ${MAX_HEALTH}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
        }}
      />
      <i
        className={`pointer-events-none absolute top-0 left-0 z-1 h-2.5 w-2.5 border-t-2 border-l-2 ${
          critical ? 'border-red' : 'border-accent'
        }`}
      />
      <i
        className={`pointer-events-none absolute bottom-0 right-0 z-1 h-2.5 w-2.5 border-b-2 border-r-2 ${
          critical ? 'border-red' : 'border-accent'
        }`}
      />

      <div className="relative z-1">
        <div className="mb-1 flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em]">
          <span className={`h-px w-2 shrink-0 ${critical ? 'bg-red' : 'bg-accent'}`} />
          <span className={critical ? 'text-red' : 'text-accent'}>Здоровье</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_HEALTH }).map((_, i) => {
            const filled = i < health
            return (
              <div
                key={i}
                className={`h-2 min-w-0 flex-1 rounded-[2px] border transition-[opacity,transform,box-shadow,filter] duration-300 ease-out motion-reduce:transition-none ${
                  filled
                    ? critical
                      ? 'border-red/40 bg-linear-to-r from-red to-[#ff6b5c] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_10px_rgba(231,76,60,0.35)]'
                      : 'border-accent/35 bg-linear-to-r from-accent to-[#ffb36a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_8px_rgba(213,96,0,0.28)]'
                    : 'border-border/50 bg-black/50 opacity-[0.38] shadow-none'
                }`}
                aria-hidden
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface GameHUDProps {
  health: number
  distance: number
  time: number
  /** Annet coins collected this run (shown only when > 0). */
  coinsCollected?: number
  godMode?: boolean
  showAdminPreviewToggle?: boolean
  adminPreviewNoDamage?: boolean
  onAdminPreviewChange?: (value: boolean) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function GameHUD({
  health,
  distance,
  time,
  coinsCollected = 0,
  godMode,
  showAdminPreviewToggle = false,
  adminPreviewNoDamage = false,
  onAdminPreviewChange,
}: GameHUDProps) {
  return (
    <div className="absolute inset-x-0 top-0 w-[90vw] pointer-events-none z-10 px-3 pt-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <HealthHud health={health} />
          {godMode && !showAdminPreviewToggle && (
            <div className="text-[9px] font-bold uppercase tracking-widest text-accent/90 px-1">
              Обзор: без урона
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-text tabular-nums tracking-wider">
            {distance.toLocaleString('ru-RU')} m
          </div>
          <div className="text-[10px] text-text-muted font-mono tabular-nums">
            {formatTime(time)}
          </div>
          {coinsCollected > 0 && (
            <div
              key={coinsCollected}
              className="mt-1 inline-flex items-center gap-1 rounded-sm border border-accent/35 bg-black/55 px-1.5 py-0.5 font-mono text-[10px] font-black text-accent tabular-nums shadow-[0_0_10px_rgba(213,96,0,0.25)]"
              style={{ animation: 'game-over-stat-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
            >
              <span aria-hidden>🪙</span>
              <span>{coinsCollected}</span>
            </div>
          )}
        </div>
      </div>

      {showAdminPreviewToggle && onAdminPreviewChange && (
        <div className="mt-3 flex justify-start pointer-events-auto">
          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border/80 bg-bg-card/85 px-2.5 py-1.5 backdrop-blur-sm">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 shrink-0 accent-accent"
              checked={adminPreviewNoDamage}
              onChange={(e) => onAdminPreviewChange(e.target.checked)}
            />
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">
              Обзор без урона
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
