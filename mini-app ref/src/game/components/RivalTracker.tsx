import { useEffect, useRef, useState } from 'react'
import type { NextRivalInfo } from '../engine/types'
import type { RivalRole } from '../../api/types'

interface RivalTrackerProps {
  nextRival: NextRivalInfo | null
}

const SPAWN_METERS = 1200

type RoleTone = 'self' | 'leader' | 'rival'

function roleTone(info: NextRivalInfo): RoleTone {
  if (info.isSelf || info.role === 'pb') return 'self'
  if (info.role === 'day_leader' || info.role === 'week_leader' || info.role === 'all_leader') {
    return 'leader'
  }
  return 'rival'
}

function roleBadge(role: RivalRole): string {
  switch (role) {
    case 'pb':
      return 'PB'
    case 'day_leader':
      return 'DAY #1'
    case 'week_leader':
      return 'WEEK #1'
    case 'all_leader':
      return 'TOP #1'
    case 'stretch':
      return 'STRETCH'
    case 'rotation':
    default:
      return 'RIVAL'
  }
}

function toneClasses(tone: RoleTone) {
  // "self" uses a cool steel-blue so PB-ghost reads distinct from leaders (accent)
  // and regular rivals (muted). Avoids clashing with the game's orange accent.
  if (tone === 'self') {
    return {
      borderClose: 'border-[#6ea9d6]/60 shadow-[0_0_28px_rgba(110,169,214,0.32)]',
      borderFar: 'border-[rgba(110,169,214,0.28)] shadow-[0_0_20px_rgba(110,169,214,0.1)]',
      headRule: 'bg-[#6ea9d6]',
      headText: 'text-[#9cc6e8]',
      badgeText: 'text-[#9cc6e8]',
      meterClose: 'text-[#9cc6e8]',
      barClose: 'bg-linear-to-r from-[#6ea9d6] to-[#9cc6e8]',
      barFar: 'bg-linear-to-r from-[#6ea9d6]/60 to-[#6ea9d6]',
    }
  }
  return {
    borderClose: 'border-accent/60 shadow-[0_0_28px_rgba(213,96,0,0.35)]',
    borderFar: 'border-[rgba(213,96,0,0.22)] shadow-[0_0_20px_rgba(213,96,0,0.1)]',
    headRule: 'bg-accent',
    headText: 'text-accent',
    badgeText: tone === 'leader' ? 'text-accent' : 'text-text-muted',
    meterClose: 'text-accent',
    barClose: 'bg-linear-to-r from-accent to-[#ffb36a]',
    barFar: 'bg-linear-to-r from-accent/70 to-accent',
  }
}

export function RivalTracker({ nextRival }: RivalTrackerProps) {
  const [displayed, setDisplayed] = useState<NextRivalInfo | null>(null)
  const [swapKey, setSwapKey] = useState(0)
  const previousNicknameRef = useRef<string | null>(null)

  useEffect(() => {
    const prevNick = previousNicknameRef.current
    const nextNick = nextRival?.nickname ?? null
    if (prevNick !== nextNick) {
      previousNicknameRef.current = nextNick
      setSwapKey((k) => k + 1)
    }
    setDisplayed(nextRival)
  }, [nextRival])

  if (!displayed) return null

  const metersAhead = Math.max(0, Math.floor(displayed.metersAhead))
  const progress = Math.max(0, Math.min(1, 1 - metersAhead / SPAWN_METERS))
  const isClose = metersAhead < 100
  const tone = roleTone(displayed)
  const cls = toneClasses(tone)
  const badge = roleBadge(displayed.role)
  const headline = displayed.isSelf ? 'СВОЙ РЕКОРД' : 'ДОГОНЯЕМ'

  return (
    <div
      className="pointer-events-none absolute left-3 top-14 z-10"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div
        key={swapKey}
        className={`relative w-44 overflow-hidden rounded-[3px] border bg-bg-card/95 px-3 py-2 ${
          isClose ? cls.borderClose : cls.borderFar
        }`}
        style={{ animation: 'rival-swap-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
          }}
        />
        <i className={`pointer-events-none absolute top-0 left-0 z-1 h-2.5 w-2.5 border-t-2 border-l-2 ${cls.headRule === 'bg-accent' ? 'border-accent' : 'border-[#6ea9d6]'}`} />
        <i className={`pointer-events-none absolute bottom-0 right-0 z-1 h-2.5 w-2.5 border-b-2 border-r-2 ${cls.headRule === 'bg-accent' ? 'border-accent' : 'border-[#6ea9d6]'}`} />

        <div className="relative z-2">
          <div className="mb-0.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em]">
            <span className={`h-px w-2 ${cls.headRule}`} />
            <span className={cls.headText}>{headline}</span>
            <span className="text-text-dim/70">·</span>
            <span className={cls.badgeText}>{badge}</span>
          </div>

          <div className="truncate text-[12px] font-bold leading-tight text-text">
            {displayed.nickname}
          </div>

          <div className="mt-0.5 flex items-baseline gap-1">
            <span
              className={`font-mono text-[13px] font-black tabular-nums ${
                isClose ? cls.meterClose : 'text-text'
              }`}
              style={isClose ? { animation: 'pulse-dot 1s ease-in-out infinite' } : undefined}
            >
              −{metersAhead.toLocaleString('ru-RU')}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-dim">
              m
            </span>
          </div>

          <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-[width] duration-200 ${
                isClose ? cls.barClose : cls.barFar
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
