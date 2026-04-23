import type { ReactNode } from 'react'

interface HudCardProps {
  children: ReactNode
  serial?: string
  tag?: string
  className?: string
}

export function HudCard({ children, serial: _serial, tag, className = '' }: HudCardProps) {
  return (
    <div
      className={`
        relative bg-bg-card border border-[rgba(213,96,0,0.18)] rounded-[4px]
        p-5 overflow-hidden ${className}
      `}
    >
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        }}
      />

      {/* Corner brackets */}
      <i className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-accent" />
      <i className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-accent" />



      {/* Tag label */}
      {tag && (
        <div className="relative z-10 flex items-center gap-1.5 mb-2.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
          <span className="w-3 h-px bg-accent" />
          {tag}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
