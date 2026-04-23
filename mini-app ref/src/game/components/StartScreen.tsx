import { useState, type ReactNode } from 'react'
import type { GameProfile } from '../../api/types'
import { SKINS, DEFAULT_SKIN_KEY, getSkin } from '../engine/constants'

interface StartScreenProps {
  onStart: () => void
  nickname: string
  defaultNickname: string
  nicknameReady: boolean
  onNicknameConfirm: (name: string) => void
  /** Admin: optional no-damage preview for exploring biomes */
  showAdminPreviewToggle?: boolean
  adminPreviewNoDamage?: boolean
  onAdminPreviewChange?: (value: boolean) => void
  /** Today's biome play order (indices into `BIOMES[]`). Desert first. */
  biomeOrder?: number[]
  /** Loaded engagement profile (streak, unlocks, active skin). */
  profile?: GameProfile | null
  /** Open the skin picker sheet. */
  onOpenSkins?: () => void
}

function KeyChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-text border border-white/12 bg-black/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_rgba(0,0,0,0.5)]">
      {children}
    </span>
  )
}

interface HintBlockProps {
  icon: string
  title: string
  keys: string[]
  children: ReactNode
}

function HintBlock({ icon, title, keys, children }: HintBlockProps) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-white/8 bg-black/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-accent via-accent/60 to-accent/20" />
      <div className="flex items-start gap-2.5 pl-1">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-accent/35 bg-accent/15 font-mono text-xs font-black text-accent shadow-[0_0_12px_rgba(213,96,0,0.25)]"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-black uppercase tracking-wide text-accent">
              {title}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
              ·
            </span>
            <div className="flex flex-wrap gap-1">
              {keys.map((k) => (
                <KeyChip key={k}>{k}</KeyChip>
              ))}
            </div>
          </div>
          <p className="text-[10px] leading-snug text-text-muted">{children}</p>
        </div>
      </div>
    </div>
  )
}

/* function BiomeRoute({ biomeOrder }: { biomeOrder: number[] }) {
  return (
    <div className="mb-3 rounded-sm border border-white/8 bg-black/40 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-px flex-1 bg-white/8" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
          Маршрут на сегодня
        </span>
        <span className="h-px flex-1 bg-white/8" />
      </div>
      <div className="flex items-center justify-between gap-1">
        {biomeOrder.map((idx, i) => {
          const b = BIOMES[idx]
          return (
            <div key={i} className="flex items-center gap-1">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-sm border border-white/12 font-mono text-[10px] font-black text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                style={{
                  background: `linear-gradient(160deg, ${b.skyTop} 0%, ${b.skyBottom} 100%)`,
                }}
                title={b.name}
              >
                {b.name.charAt(0).toUpperCase()}
              </div>
              {i < biomeOrder.length - 1 && (
                <span className="text-[9px] font-bold text-text-dim">→</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} */

function StreakChip({ streakDays }: { streakDays: number }) {
  if (streakDays <= 0) {
    return (
      <div className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-white/10 bg-black/35 px-2 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
          Стрик: начните сегодня
        </span>
      </div>
    )
  }
  return (
    <div className="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-accent/30 bg-accent/10 px-2 py-1.5 shadow-[0_0_14px_rgba(213,96,0,0.18)]">
      <span aria-hidden className="text-[13px]">🔥</span>
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-accent">
        День {streakDays} подряд
      </span>
    </div>
  )
}

/**
 * Compact row for the currently-equipped skin + a button to open the
 * skin picker sheet. Shows progress toward the next unlock so the player
 * has a reason to tap through.
 */
function ActiveSkinRow({
  profile,
  onOpen,
}: {
  profile: GameProfile | null
  onOpen?: () => void
}) {
  const active = getSkin(profile?.active_skin ?? DEFAULT_SKIN_KEY)
  const totalCoins = profile?.total_coins ?? 0
  const unlockedCount = profile?.unlocked_skins?.length ?? 1
  const nextKey = profile?.next_unlock_key ?? null
  const nextAt = profile?.next_unlock_at ?? null
  const nextSkin = nextKey ? SKINS.find((s) => s.key === nextKey) : null
  const remaining = nextAt != null ? Math.max(0, nextAt - totalCoins) : 0
  const canOpen = typeof onOpen === 'function'

  return (
    <div className="mb-3 rounded-sm border border-white/8 bg-black/40 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-px flex-1 bg-white/8" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
          Скин
        </span>
        <span className="h-px flex-1 bg-white/8" />
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/12 text-xl"
          style={{
            background: `linear-gradient(160deg, ${active.swatch}55 0%, ${active.swatch}18 100%)`,
          }}
          aria-hidden
        >
          {active.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-black uppercase tracking-wide text-text">
            {active.label}
          </div>
          <div className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-text-dim">
            Открыто <span className="text-accent tabular-nums">{unlockedCount}</span>/{SKINS.length}
            {nextSkin && nextAt != null && (
              <>
                {' · до «'}
                <span className="lowercase">{nextSkin.label}</span>
                {'»: '}
                <span className="text-accent tabular-nums">{remaining}</span> 🪙
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen}
          className="shrink-0 rounded-sm border border-accent/40 bg-accent/15 px-2.5 py-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent/25 disabled:cursor-default disabled:opacity-50"
        >
          Скины →
        </button>
      </div>
    </div>
  )
}

export function StartScreen({
  onStart,
  nickname,
  defaultNickname,
  nicknameReady,
  onNicknameConfirm,
  showAdminPreviewToggle = false,
  adminPreviewNoDamage = false,
  onAdminPreviewChange,
  profile,
  onOpenSkins,
}: StartScreenProps) {
  const [inputValue, setInputValue] = useState(nickname || defaultNickname)

  const confirm = (value: string) => {
    if (typeof onNicknameConfirm !== 'function') return
    onNicknameConfirm(value)
  }

  if (!nicknameReady) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/90">
        <img
          src={`/assets/${encodeURIComponent('Annet Fox.webp')}`}
          alt="Annet Fox"
          className="h-[25vh] mb-6 pointer-events-none select-none"
          style={{
            filter: 'drop-shadow(0 16px 40px rgba(213,96,0,0.35))',
            animation: 'fox-float 3s ease-in-out infinite',
          }}
        />

        <h1 className="text-2xl font-extrabold text-text tracking-tight mb-1">
          Annet Rush
        </h1>
        <p className="text-xs text-text-muted mb-6">
          Введите ник для таблицы рекордов
        </p>

        <div className="w-full max-w-[240px] flex flex-col gap-3 px-6">
          <input
            type="text"
            maxLength={32}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirm(inputValue)
            }}
            placeholder="Ваш ник"
            className="w-full px-4 py-3 bg-bg-card border border-border rounded-sm text-sm text-text text-center font-semibold outline-none focus:border-accent placeholder:text-text-dim"
            autoFocus
          />
          <button
            type="button"
            onClick={() => confirm(inputValue)}
            className="w-full py-3 bg-accent text-white text-sm font-bold rounded-sm cursor-pointer active:opacity-80"
          >
            Продолжить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-20 flex min-h-0 flex-col justify-end overflow-hidden pointer-events-none">
      <div
        className="pointer-events-auto flex min-h-0 max-h-[min(92dvh,calc(100dvh-1.5rem))] flex-col justify-end bg-linear-to-t from-[#0a0603]/95 via-[#1a1008]/55 to-transparent pt-14 pb-8 px-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="relative mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col"
          style={{ animation: 'game-start-panel-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
        >
          <div
            className="pointer-events-none absolute -inset-[2px] rounded-sm opacity-70 blur-[1px]"
            style={{
              background: 'linear-gradient(135deg, rgba(213,96,0,0.5) 0%, transparent 45%, rgba(213,96,0,0.15) 100%)',
              animation: 'game-hud-shine 3s ease-in-out infinite',
            }}
          />

          <div className="relative flex min-h-0 max-h-full flex-col overflow-hidden rounded-sm border-2 border-accent/35 bg-[#0c0c0c]/92 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.55),0_0_32px_rgba(213,96,0,0.12)] backdrop-blur-md">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.5) 2px,
                  rgba(255,255,255,0.5) 3px
                )`,
              }}
            />

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-5 pb-2 [-webkit-overflow-scrolling:touch]">
              <div className="mb-1 flex justify-center">
                <div className="h-0.5 w-12 rounded-full bg-accent shadow-[0_0_12px_rgba(213,96,0,0.8)]" />
              </div>

              <h1 className="text-center font-black uppercase tracking-[0.18em] text-text [text-shadow:0_0_20px_rgba(213,96,0,0.35),0_2px_0_rgba(0,0,0,0.8)]">
                <span className="text-[11px] text-text-muted">Annet</span>
                <br />
                <span className="text-xl leading-tight text-white">Rush</span>
              </h1>
              <p className="mt-1 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-accent/90">
                Endless runner
              </p>
              <p className="mt-0.5 text-center text-[9px] tracking-wide text-text-dim">
                Annet Cloud
              </p>

              {profile && <div className="mt-4"><StreakChip streakDays={profile.streak_days} /></div>}
{/* 
              {biomeOrder && biomeOrder.length > 0 && <BiomeRoute biomeOrder={biomeOrder} />} */}

              <ActiveSkinRow profile={profile ?? null} onOpen={onOpenSkins} />

              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2 px-0.5">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-accent/40 to-accent/70" />
                  <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-accent">
                    Как играть
                  </span>
                  <div className="h-px flex-1 bg-linear-to-l from-transparent via-accent/40 to-accent/70" />
                </div>

                <HintBlock icon="↑" title="Прыжок" keys={['тап', 'Space', '↑', 'W']}>
                  Перепрыгивайте препятствия на земле.
                </HintBlock>

                <HintBlock icon="↓" title="Присед" keys={['свайп', '↓', 'S']}>
                  Приседайте под низкими препятствиями в воздухе.
                </HintBlock>

                <HintBlock icon="🪙" title="Монеты Annet" keys={['прыжок', 'присед']}>
                  Собирайте монеты во время забега - открывайте новые скины.
                </HintBlock>
              </div>

              {showAdminPreviewToggle && onAdminPreviewChange && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-sm border border-white/10 bg-black/35 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    checked={adminPreviewNoDamage}
                    onChange={(e) => onAdminPreviewChange(e.target.checked)}
                  />
                  <span className="text-[10px] leading-snug text-text-muted">
                    <span className="font-bold text-text">Обзор без урона</span>
                    - препятствия не мешают, счёт не отправляется. Выключите для обычной игры и рекордов.
                  </span>
                </label>
              )}
              </div>

              <div className="shrink-0 border-t border-white/6 bg-[#0c0c0c]/95 px-5 pb-5 pt-3">
              <button
                type="button"
                onClick={onStart}
                className="relative w-full overflow-hidden rounded-sm border border-[#ff9a4a]/50 bg-linear-to-b from-[#ff8f3d] to-accent py-3.5 font-black uppercase tracking-[0.22em] text-white shadow-[0_4px_0_#7a3400,0_8px_28px_rgba(213,96,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform active:translate-y-0.5 active:shadow-[0_2px_0_#7a3400,0_4px_16px_rgba(213,96,0,0.35)]"
              >
                <span className="relative z-10 text-sm">Начать</span>
                <span
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
                    animation: 'hud-shift 4s ease-in-out infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
