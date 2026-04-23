import { useEffect, useState } from 'react'
import { fetchGameProfile } from '../../api/endpoints'
import type { GameProfile } from '../../api/types'
import { SKINS, getSkin } from '../engine/constants'

interface GameTabSummaryProps {
  telegramId?: number | null
  /** Increment after a game session so profile (coins, streak, skins) refetches. */
  refreshKey?: number
}

/**
 * Compact "what's inside today" card for the Game tab in the mini-app.
 *
 * Surfaces the Stage 0.5 retention hooks - daily biome route, streak, coin
 * balance and skin unlock progress - so a player sees why to tap "Начать
 * игру" before they open the game itself. When there's no telegramId or the
 * profile fetch fails, we still render a zero-state card so the feature is
 * discoverable.
 */
export function GameTabSummary({ telegramId, refreshKey = 0 }: GameTabSummaryProps) {
  const [profile, setProfile] = useState<GameProfile | null>(null)

  useEffect(() => {
    if (!telegramId) return
    let cancelled = false
    fetchGameProfile(telegramId)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [telegramId, refreshKey])

  const streak = profile?.streak_days ?? 0
  const totalCoins = profile?.total_coins ?? 0
  const unlockedCount = profile?.unlocked_skins?.length ?? 1
  const totalSkins = SKINS.length
  const nextUnlockKey = profile?.next_unlock_key ?? null
  const nextUnlockAt = profile?.next_unlock_at ?? null
  const nextSkin = nextUnlockKey ? getSkin(nextUnlockKey) : null
  const allUnlocked = profile != null && nextUnlockKey == null

  return (
    <div className="w-full rounded-sm border border-white/10 bg-black/55 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-px flex-1 bg-white/8" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
          Что внутри сегодня
        </span>
        <span className="h-px flex-1 bg-white/8" />
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1.5">
        <StatTile
          label="Стрик"
          value={streak > 0 ? `🔥 ${streak}` : '-'}
          accent={streak > 0}
          hint={streak > 0 ? 'день подряд' : 'начните сегодня'}
        />
        <StatTile
          label="Монеты"
          value={`🪙 ${totalCoins}`}
          accent={totalCoins > 0}
          hint="открывают скины"
        />
        <StatTile
          label="Скины"
          value={`${unlockedCount}/${totalSkins}`}
          accent={unlockedCount > 1}
          hint={
            allUnlocked
              ? 'все открыто'
              : nextSkin && nextUnlockAt != null
              ? `до «${nextSkin.label.toLowerCase()}»: ${Math.max(0, nextUnlockAt - totalCoins)} 🪙`
              : 'собирайте 🪙'
          }
        />
      </div>

      <div className="rounded-sm border border-white/8 bg-black/35 px-2 py-1.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-text-dim">
            Скины за 🪙
          </span>
          <span className="h-px flex-1 bg-white/8" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-text-dim">
            для лисы
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SKINS.map((skin) => {
            const isUnlocked = profile?.unlocked_skins?.includes(skin.key) ?? skin.unlockAt === 0
            const isActive = profile?.active_skin === skin.key
            const progress = Math.min(totalCoins, skin.unlockAt)
            const remaining = Math.max(0, skin.unlockAt - totalCoins)
            const pct = skin.unlockAt > 0
              ? Math.min(100, (progress / skin.unlockAt) * 100)
              : 100
            return (
              <div
                key={skin.key}
                className={`relative flex flex-col items-center gap-1 rounded-sm border px-1 pb-1.5 pt-1.5 text-center ${
                  isActive
                    ? 'border-accent/60 bg-accent/18 shadow-[0_0_12px_rgba(213,96,0,0.25)]'
                    : isUnlocked
                    ? 'border-accent/45 bg-accent/10 shadow-[0_0_10px_rgba(213,96,0,0.14)]'
                    : 'border-white/10 bg-black/40'
                }`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-lg"
                  style={{
                    background: isUnlocked
                      ? `linear-gradient(160deg, ${skin.swatch}55 0%, ${skin.swatch}18 100%)`
                      : 'rgba(0,0,0,0.45)',
                    opacity: isUnlocked ? 1 : 0.55,
                  }}
                  aria-hidden
                >
                  {isUnlocked ? skin.icon : '🔒'}
                </span>
                <div
                  className={`font-mono text-[9px] font-bold uppercase tracking-wider leading-tight ${
                    isUnlocked ? 'text-accent' : 'text-text'
                  }`}
                >
                  {skin.label}
                </div>
                <div className="flex w-full items-center gap-1">
                  <span
                    className={`font-mono text-[9px] font-black tabular-nums ${
                      isUnlocked ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    {isUnlocked ? (isActive ? '●' : '✓') : `${progress}/${skin.unlockAt}`}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-sm bg-black/55">
                    <div
                      className={`h-full ${isUnlocked ? 'bg-accent' : 'bg-accent/60'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="font-mono text-[8px] font-bold text-text-dim">
                  {isActive
                    ? 'активен'
                    : isUnlocked
                    ? 'открыто'
                    : remaining > 0
                    ? `ещё ${remaining} 🪙`
                    : 'готово!'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm border px-1.5 py-1.5 text-center ${
        accent
          ? 'border-accent/30 bg-accent/10 shadow-[0_0_10px_rgba(213,96,0,0.14)]'
          : 'border-white/8 bg-black/35'
      }`}
    >
      <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-text-dim">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono text-[11px] font-black tabular-nums ${
          accent ? 'text-accent' : 'text-text-muted'
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[8px] leading-snug text-text-dim truncate" title={hint}>
        {hint}
      </div>
    </div>
  )
}
