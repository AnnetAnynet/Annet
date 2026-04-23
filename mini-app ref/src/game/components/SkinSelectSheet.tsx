import { useEffect } from 'react'
import type { GameProfile } from '../../api/types'
import { SKINS, type SkinDef, DEFAULT_SKIN_KEY } from '../engine/constants'

interface SkinSelectSheetProps {
  open: boolean
  profile: GameProfile | null
  onClose: () => void
  onSelect: (key: string) => void
}

/**
 * Bottom sheet for picking a fox skin. Locked skins show the coin threshold
 * and current progress; unlocked skins can be activated with a tap. The
 * sheet is a pure presentation component - network + profile updates are
 * owned by the caller (GameScreen).
 */
export function SkinSelectSheet({ open, profile, onClose, onSelect }: SkinSelectSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const totalCoins = profile?.total_coins ?? 0
  const unlocked = new Set<string>(profile?.unlocked_skins ?? [DEFAULT_SKIN_KEY])
  const active = profile?.active_skin ?? DEFAULT_SKIN_KEY

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center px-3 pb-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease-out' }}
      />

      <div
        className="relative w-full max-w-sm overflow-hidden rounded-sm border-2 border-accent/30 bg-[#0c0c0c]/96 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.55),0_0_28px_rgba(213,96,0,0.12)]"
        style={{ animation: 'game-start-panel-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
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

        <div className="relative p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-accent">
                Скины лисы
              </div>
              <div className="mt-0.5 text-[10px] leading-snug text-text-dim">
                Собирайте монеты Annet за забег и открывайте новые образы.
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-white/12 bg-black/45 font-mono text-sm text-text-muted transition-colors hover:border-accent/35 hover:text-text"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2 rounded-sm border border-white/8 bg-black/40 px-2.5 py-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-text-dim">
              В кошельке
            </span>
            <span className="font-mono text-xs font-black tabular-nums text-accent">
              🪙 {totalCoins}
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {SKINS.map((skin) => (
              <SkinRow
                key={skin.key}
                skin={skin}
                isUnlocked={unlocked.has(skin.key)}
                isActive={active === skin.key}
                totalCoins={totalCoins}
                onSelect={() => onSelect(skin.key)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

interface SkinRowProps {
  skin: SkinDef
  isUnlocked: boolean
  isActive: boolean
  totalCoins: number
  onSelect: () => void
}

function SkinRow({ skin, isUnlocked, isActive, totalCoins, onSelect }: SkinRowProps) {
  const remaining = Math.max(0, skin.unlockAt - totalCoins)
  const progress = skin.unlockAt > 0 ? Math.min(100, (totalCoins / skin.unlockAt) * 100) : 100
  const canActivate = isUnlocked && !isActive

  return (
    <li>
      <button
        type="button"
        disabled={!canActivate}
        onClick={onSelect}
        className={`relative flex w-full items-stretch gap-2.5 overflow-hidden rounded-sm border px-2.5 py-2.5 text-left transition-colors ${
          isActive
            ? 'border-accent/55 bg-accent/12 shadow-[0_0_18px_rgba(213,96,0,0.22)]'
            : isUnlocked
            ? 'border-white/14 bg-black/40 hover:border-accent/40 hover:bg-black/55'
            : 'cursor-not-allowed border-white/8 bg-black/25 opacity-85'
        }`}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-white/10 text-xl"
          style={{
            background: `linear-gradient(160deg, ${skin.swatch}55 0%, ${skin.swatch}18 100%)`,
            filter: isUnlocked ? undefined : 'grayscale(0.8)',
          }}
          aria-hidden
        >
          {isUnlocked ? skin.icon : '🔒'}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`truncate text-[13px] font-black uppercase tracking-wide ${
                isActive ? 'text-accent' : isUnlocked ? 'text-text' : 'text-text-muted'
              }`}
            >
              {skin.label}
            </span>
            {isActive && (
              <span className="rounded-sm border border-accent/50 bg-accent/15 px-1 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-accent">
                Активно
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[10px] leading-snug text-text-dim">
            {skin.description}
          </p>

          {!isUnlocked && skin.unlockAt > 0 && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-text-dim">
                  Ещё <span className="text-accent tabular-nums">{remaining}</span> 🪙
                </span>
                <span className="font-mono text-[9px] font-black tabular-nums text-text-muted">
                  {totalCoins}/{skin.unlockAt}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-sm bg-black/55">
                <div
                  className="h-full bg-accent/70"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isUnlocked && !isActive && (
            <span className="mt-1 inline-block font-mono text-[9px] font-black uppercase tracking-[0.2em] text-accent">
              Выбрать →
            </span>
          )}

          {isUnlocked && skin.unlockAt === 0 && isActive && (
            <span className="mt-1 inline-block font-mono text-[9px] font-bold uppercase tracking-wider text-text-dim">
              Открыт с первого забега
            </span>
          )}
        </div>
      </button>
    </li>
  )
}
