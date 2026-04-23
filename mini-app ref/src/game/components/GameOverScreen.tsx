import { BIOMES, SKINS } from '../engine/constants'
import type { Rival } from '../rivals'
import { roleLabel } from '../rivals'

interface StreakInfo {
  streakDays: number
  streakContinues: boolean
}

interface GameOverScreenProps {
  distance: number
  time: number
  biomeIndex: number
  personalBest: number
  isNewRecord: boolean
  dayRank?: number | null
  rivals?: Rival[]
  overtakes?: number
  /** Streak info from score submission (hidden if not provided). */
  streak?: StreakInfo | null
  /** Annet coins collected this run (for the "+N 🪙" badge). */
  coinsCollected?: number
  /** Skin keys unlocked by this run. */
  newlyUnlockedSkins?: string[]
  onRestart: () => void
  onClose: () => void
}

function streakLabel(info: StreakInfo): string {
  if (info.streakContinues && info.streakDays === 1) return 'Старт стрика · день 1'
  if (info.streakContinues) return `Стрик +1 · день ${info.streakDays}`
  return 'Новый стрик · день 1'
}

function skinLabel(key: string): string {
  return SKINS.find((s) => s.key === key)?.label ?? key
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StatTile({
  label,
  value,
  valueClassName,
  delayMs,
}: {
  label: string
  value: string
  valueClassName?: string
  delayMs: number
}) {
  return (
    <div
      className="relative overflow-hidden rounded-sm border border-white/8 bg-black/40 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{
        animation: `game-over-stat-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both`,
      }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-accent via-accent/50 to-accent/15" />
      <div className="pl-1">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim">{label}</div>
        <div
          className={`mt-1 wrap-break-word text-sm font-black leading-tight tabular-nums ${valueClassName ?? 'text-text'}`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

interface MissedRivalRow {
  rival: Rival
  gap: number
}

function pickMissedRivals(rivals: Rival[], finalDistance: number, limit = 3): MissedRivalRow[] {
  // PB-ghost (isSelf) is handled separately above the list - it gets its own
  // headline row since "you didn't beat your record" is its own story.
  return rivals
    .filter((r) => !r.isSelf)
    .map((r) => ({ rival: r, gap: r.bestDistance - finalDistance }))
    .filter((row) => row.gap > 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, limit)
}

function findSelfRival(rivals: Rival[] | undefined): Rival | null {
  if (!rivals) return null
  return rivals.find((r) => r.isSelf) ?? null
}

export function GameOverScreen({
  distance,
  time,
  biomeIndex,
  personalBest,
  isNewRecord,
  dayRank,
  rivals,
  overtakes,
  streak,
  coinsCollected = 0,
  newlyUnlockedSkins,
  onRestart,
  onClose,
}: GameOverScreenProps) {
  const currentDistance = Math.floor(distance)
  const missed = rivals ? pickMissedRivals(rivals, currentDistance) : []
  const selfRival = findSelfRival(rivals)
  const pbGap = selfRival ? selfRival.bestDistance - currentDistance : 0
  const pbMissed = selfRival != null && pbGap > 0 && !isNewRecord

  return (
    <div
      className="absolute inset-0 z-30 flex min-h-0 flex-col items-center justify-center overflow-hidden px-4 py-2"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#120a05]/90 via-[#0a0603]/92 to-[#050302]/95"
        style={{ animation: 'fade-in 0.35s ease-out' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(213,96,0,0.5), transparent 55%)`,
          animation: 'fade-in 0.5s ease-out',
        }}
      />

      <div
        className="relative mx-auto flex min-h-0 w-full max-w-sm max-h-[min(94dvh,calc(100dvh-1rem))] flex-col"
        style={{ animation: 'game-start-panel-in 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-sm opacity-60 blur-[1px]"
          style={{
            background:
              'linear-gradient(135deg, rgba(231,76,60,0.38) 0%, transparent 42%, rgba(213,96,0,0.2) 100%)',
            animation: 'game-hud-shine 2.8s ease-in-out infinite',
          }}
        />

        <div className="relative flex min-h-0 max-h-full flex-col overflow-hidden rounded-sm border-2 border-red/30 bg-[#0c0c0c]/94 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.6),0_0_28px_rgba(231,76,60,0.1)] backdrop-blur-md">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.45) 2px,
                rgba(255,255,255,0.45) 3px
              )`,
            }}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-5 pb-2 [-webkit-overflow-scrolling:touch]">
          <div className="relative">
            <div className="mb-2 flex justify-center">
              <div
                className="h-0.5 w-14 rounded-full bg-red shadow-[0_0_14px_rgba(231,76,60,0.55)]"
                style={{ animation: 'game-over-stat-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both' }}
              />
            </div>

            <div
              className="text-center"
              style={{ animation: 'game-over-stat-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both' }}
            >
              {isNewRecord && (
                <div
                  className="mb-2 inline-flex items-center justify-center rounded-sm border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.28em] text-accent shadow-[0_0_16px_rgba(213,96,0,0.25)]"
                  style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }}
                >
                  Новый рекорд
                </div>
              )}

              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.38em] text-red">
                Game Over
              </p>

              <div
                className="mt-1.5 font-black tracking-tight text-white [text-shadow:0_0_24px_rgba(231,76,60,0.28),0_2px_0_rgba(0,0,0,0.85)]"
                style={{ animation: 'game-over-score-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both' }}
              >
                <span className="text-3xl tabular-nums">{currentDistance.toLocaleString('ru-RU')}</span>
                <span className="ml-1 text-sm font-extrabold text-text-muted">m</span>
              </div>

              {personalBest > 0 && !isNewRecord && (
                <p
                  className="mt-1.5 text-[10px] text-text-dim"
                  style={{ animation: 'game-over-stat-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both' }}
                >
                  Лучший результат:{' '}
                  <span className="font-bold text-text-muted tabular-nums">
                    {personalBest.toLocaleString('ru-RU')} m
                  </span>
                </p>
              )}
            </div>

            {streak && (
              <div
                className={`mt-3 flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 ${
                  streak.streakContinues
                    ? 'border border-accent/30 bg-accent/10 shadow-[0_0_14px_rgba(213,96,0,0.18)]'
                    : 'border border-white/10 bg-black/35'
                }`}
                style={{ animation: 'game-over-stat-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both' }}
              >
                <span aria-hidden className="text-[13px]">🔥</span>
                <span
                  className={`font-mono text-[10px] font-black uppercase tracking-[0.22em] ${
                    streak.streakContinues ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {streakLabel(streak)}
                </span>
              </div>
            )}

            {coinsCollected > 0 && (
              <div
                className="mt-2 flex flex-col items-center justify-center gap-0.5"
                style={{ animation: 'game-over-stat-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both' }}
              >
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-accent">
                  +{coinsCollected} 🪙 монет{coinsCollected === 1 ? 'а' : coinsCollected < 5 ? 'ы' : ''}
                </span>
                {(!newlyUnlockedSkins || newlyUnlockedSkins.length === 0) && (
                  <span className="text-[9px] text-text-dim">
                    копите 🪙 - открывайте новые скины
                  </span>
                )}
              </div>
            )}

            {newlyUnlockedSkins && newlyUnlockedSkins.length > 0 && (
              <div
                className="mt-3 rounded-sm border border-accent/50 bg-accent/15 px-3 py-2 text-center shadow-[0_0_18px_rgba(213,96,0,0.28)]"
                style={{ animation: 'game-over-stat-in 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both' }}
              >
                <div className="font-mono text-[9px] font-black uppercase tracking-[0.26em] text-accent">
                  Новый скин разблокирован
                </div>
                <div className="mt-0.5 text-[11px] font-bold text-white">
                  {newlyUnlockedSkins.map(skinLabel).join(' · ')}
                </div>
              </div>
            )}

            {dayRank != null && dayRank <= 10 && (
              <div
                className="mt-4 flex items-center justify-center gap-2 rounded-sm border border-white/8 bg-black/35 py-2"
                style={{ animation: 'game-over-stat-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both' }}
              >
                <span
                  className={`font-mono text-xs font-black tabular-nums ${
                    dayRank === 1 ? 'text-[#FFD700]' : dayRank <= 3 ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  #{dayRank}
                </span>
                <span className="text-[10px] font-semibold text-text-dim">
                  {dayRank === 1 ? 'лидер дня' : 'сегодня'}
                </span>
              </div>
            )}

            {overtakes != null && overtakes > 0 && (
              <div
                className="mt-3 flex items-center justify-center gap-1.5"
                style={{ animation: 'game-over-stat-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both' }}
              >
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-green">
                  {overtakes} {overtakes === 1 ? 'обгон' : overtakes < 5 ? 'обгона' : 'обгонов'}
                </span>
              </div>
            )}

            {pbMissed && selfRival && (
              <div
                className="mt-4 relative flex items-center gap-2 overflow-hidden rounded-sm border border-[#6ea9d6]/35 bg-[#6ea9d6]/8 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                style={{ animation: 'game-over-stat-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both' }}
              >
                <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-[#6ea9d6] via-[#6ea9d6]/50 to-[#6ea9d6]/15" />
                <span className="ml-1 min-w-[56px] font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#9cc6e8]">
                  PB
                </span>
                <span className="flex-1 truncate text-[11px] font-bold text-text">
                  Свой рекорд
                </span>
                <span className="font-mono text-[11px] font-black tabular-nums text-[#9cc6e8]">
                  −{Math.floor(pbGap).toLocaleString('ru-RU')}
                  <span className="ml-0.5 text-[9px] font-bold text-text-dim">m</span>
                </span>
              </div>
            )}

            {missed.length > 0 && (
              <div
                className="mt-4"
                style={{ animation: 'game-over-stat-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both' }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="h-px flex-1 bg-white/8" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
                    Не догнали
                  </span>
                  <span className="h-px flex-1 bg-white/8" />
                </div>
                <ul className="space-y-1.5">
                  {missed.map(({ rival, gap }) => (
                    <li
                      key={rival.nickname}
                      className="relative flex items-center gap-2 overflow-hidden rounded-sm border border-white/8 bg-black/40 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-accent/70 via-accent/35 to-accent/10" />
                      <span className="ml-1 min-w-[56px] font-mono text-[9px] font-black uppercase tracking-[0.18em] text-text-muted">
                        {roleLabel(rival)}
                      </span>
                      <span className="flex-1 truncate text-[11px] font-bold text-text">
                        {rival.nickname}
                      </span>
                      <span className="font-mono text-[11px] font-black tabular-nums text-red">
                        −{Math.floor(gap).toLocaleString('ru-RU')}
                        <span className="ml-0.5 text-[9px] font-bold text-text-dim">m</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <StatTile label="Время" value={formatTime(time)} delayMs={160} />
              <StatTile
                label="Локация"
                value={BIOMES[biomeIndex].name}
                valueClassName="text-accent"
                delayMs={200}
              />
            </div>
          </div>
            </div>

            <div className="shrink-0 border-t border-white/6 bg-[#0c0c0c]/95 px-5 pb-5 pt-3">
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="relative w-full overflow-hidden rounded-sm border border-[#ff9a4a]/50 bg-linear-to-b from-[#ff8f3d] to-accent py-3.5 font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_0_#7a3400,0_8px_28px_rgba(213,96,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#7a3400,0_4px_16px_rgba(213,96,0,0.35)]"
                style={{ animation: 'game-over-stat-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both' }}
              >
                <span className="relative z-10 text-sm">Ещё раз</span>
                <span
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
                    animation: 'hud-shift 4s ease-in-out infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-sm border border-white/10 bg-black/35 py-2.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-accent/25 hover:text-text active:opacity-80"
                style={{ animation: 'game-over-stat-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both' }}
              >
                Закрыть
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
