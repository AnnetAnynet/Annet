import { useState } from 'react'
import { GUIDES, type Guide } from '../data/guides'
import { StoriesViewer } from './StoriesViewer'

export function GuidesSection() {
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null)

  return (
    <>
      <section>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-px bg-accent" />
          <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-accent">
            Инструкции
          </span>
        </div>

        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Пошаговые подсказки - нажмите на карточку, чтобы открыть
        </p>

        {/* Horizontal scrollable carousel */}
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {GUIDES.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              onClick={() => setActiveGuide(guide)}
            />
          ))}
          {/* Trailing spacer so last card isn't flush against edge */}
          <div className="shrink-0 w-1" />
        </div>
      </section>

      {/* Stories overlay */}
      {activeGuide && (
        <StoriesViewer
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
        />
      )}
    </>
  )
}

interface GuideCardProps {
  guide: Guide
  onClick: () => void
}

function GuideCard({ guide, onClick }: GuideCardProps) {
  const slideCount = guide.slides.length

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-36 relative bg-bg-card border border-[rgba(213,96,0,0.22)] rounded-[4px] p-4 text-left overflow-hidden active:scale-95 transition-transform duration-100 cursor-pointer group"
      aria-label={`Открыть инструкцию: ${guide.title}`}
    >
      {/* Corner accents */}
     {/*  <i className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent opacity-70" />
      <i className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent opacity-70" /> */}

      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)',
        }}
      />

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(213,96,0,0.45)' }}
      />

      {/* Icon */}
      <div className="text-3xl leading-none mb-3 relative z-10">
        {guide.icon}
      </div>

      {/* Title */}
      <div className="text-[13px] font-bold text-text leading-snug mb-1.5 relative z-10">
        {guide.title}
      </div>

      {/* Subtitle */}
      <div className="text-[10px] text-text-muted leading-tight relative z-10">
        {guide.subtitle}
      </div>

      {/* Slide count pill */}
      <div className="mt-3 flex items-center gap-1 relative z-10">
        {Array.from({ length: Math.min(slideCount, 5) }).map((_, i) => (
          <div
            key={i}
            className="h-[2px] flex-1 rounded-full bg-accent/30"
          />
        ))}
      </div>
    </button>
  )
}
