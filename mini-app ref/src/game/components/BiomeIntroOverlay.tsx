import { BIOME_TRANSITION_S } from '../engine/constants'

interface BiomeIntroOverlayProps {
  /** Shown only while the engine reports an active biome cross-fade. */
  title: string | null
}

/**
 * Compact biome label shown near the top of the screen during a biome change.
 * Intentionally small and non-blocking: no full-screen dim, no blur, no center-stage
 * title - the player must keep full visibility of the fox and incoming obstacles.
 */
export function BiomeIntroOverlay({ title }: BiomeIntroOverlayProps) {
  if (!title) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-35 flex justify-center"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
      aria-hidden
    >
      <div
        className="flex items-center gap-2 rounded-full border border-accent/30 bg-black/45 px-3 py-1 backdrop-blur-[2px]"
        style={{
          animation: `biome-intro-chip ${BIOME_TRANSITION_S}s cubic-bezier(0.2, 0.9, 0.2, 1) forwards`,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.35)',
        }}
      >
        <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text whitespace-nowrap">
          {title}
        </span>
        <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
      </div>
    </div>
  )
}
