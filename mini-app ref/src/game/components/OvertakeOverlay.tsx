import type { OvertakeEvent } from '../engine/types'
import type { RivalRole } from '../../api/types'

interface OvertakeOverlayProps {
  /** Most recent overtake event (or null if none fired yet). */
  event: OvertakeEvent | null
  /** Monotonic id - increments even if the same rival is overtaken twice. */
  eventId: number
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

export function OvertakeOverlay({ event, eventId }: OvertakeOverlayProps) {
  if (!event) return null
  const isSelf = event.isSelf
  // PB-ghost gets a different headline - beating your own record reads
  // as "new personal best", not an "overtake".
  const title = isSelf ? 'НОВЫЙ PB' : 'ОБГОН'

  return (
    <>
      <div
        key={`flash-${eventId}`}
        className={`pointer-events-none absolute inset-0 z-20 mix-blend-screen ${
          isSelf ? 'bg-[#6ea9d6]/25' : 'bg-accent/30'
        }`}
        style={{ animation: 'overtake-flash 0.4s ease-out forwards' }}
      />

      <div
        key={`toast-${eventId}`}
        className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center px-4"
        style={{ animation: 'overtake-toast-in 1.2s ease-out forwards' }}
      >
        <div
          className={`relative overflow-hidden rounded-[3px] border bg-bg-card/95 px-3.5 py-1.5 ${
            isSelf
              ? 'border-[#6ea9d6]/55 shadow-[0_0_28px_rgba(110,169,214,0.4)]'
              : 'border-accent/55 shadow-[0_0_28px_rgba(213,96,0,0.45)]'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)',
            }}
          />
          <i
            className={`pointer-events-none absolute top-0 left-0 z-1 h-2.5 w-2.5 border-t-2 border-l-2 ${
              isSelf ? 'border-[#6ea9d6]' : 'border-accent'
            }`}
          />
          <i
            className={`pointer-events-none absolute bottom-0 right-0 z-1 h-2.5 w-2.5 border-b-2 border-r-2 ${
              isSelf ? 'border-[#6ea9d6]' : 'border-accent'
            }`}
          />
          <div className="relative z-2 flex items-center gap-2 whitespace-nowrap text-[11px] font-bold tracking-tight">
            <span
              className={`font-mono text-[9px] font-black uppercase tracking-[0.22em] ${
                isSelf ? 'text-[#9cc6e8]' : 'text-accent'
              }`}
            >
              {title}
            </span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">
              {roleBadge(event.role)}
            </span>
            <span className="text-green">{event.nickname}</span>
          </div>
        </div>
      </div>
    </>
  )
}
