import { useCallback, useEffect, useRef, useState } from 'react'
import type { Guide } from '../data/guides'

interface StoriesViewerProps {
  guide: Guide
  onClose: () => void
}

const SLIDE_DURATION_MS = 5000

export function StoriesViewer({ guide, onClose }: StoriesViewerProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoProgress, setVideoProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const total = guide.slides.length
  const slide = guide.slides[current]
  const isVideoSlide = !!slide.video
  const hasMedia = !!(slide.video || slide.image)

  const goTo = useCallback((index: number) => {
    if (index >= total) {
      onClose()
      return
    }
    setCurrent(Math.max(0, index))
    setProgress(0)
    setVideoProgress(0)
    startTimeRef.current = null
    pausedAtRef.current = 0
  }, [total, onClose])

  const goNext = useCallback(() => goTo(current + 1), [current, goTo])
  const goPrev = useCallback(() => goTo(Math.max(0, current - 1)), [current, goTo])

  // Timer-based progress for text slides
  useEffect(() => {
    if (paused || isVideoSlide) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current * SLIDE_DURATION_MS
      }
      const elapsed = timestamp - startTimeRef.current
      const pct = Math.min(elapsed / SLIDE_DURATION_MS, 1)
      setProgress(pct)

      if (pct >= 1) {
        goNext()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [current, paused, goNext, isVideoSlide])

  // Pause / resume video when hold gesture changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) {
      video.pause()
    } else {
      video.play().catch(() => { })
    }
  }, [paused])

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width * 0.35) {
      goPrev()
    } else {
      goNext()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col "
      style={{ touchAction: 'none' }}
    >
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-2 z-20">
        {guide.slides.map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full bg-white/20 overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-accent transition-none"
              style={{
                width:
                  i < current
                    ? '100%'
                    : i === current
                      ? `${(isVideoSlide ? videoProgress : progress) * 100}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2  "
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{guide.icon}</span>
          <span className="text-sm font-semibold text-text truncate max-w-[200px]">
            {guide.title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-full"
          aria-label="Закрыть"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tap zones + content */}
      <div
        className="flex-1 relative isolate select-none cursor-pointer overflow-hidden bg-black pb-8 justify-center items-center"
        onClick={handleTap}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Remount all media per slide so previous video frame / images never bleed through */}
        <div
          key={`slide-media-${current}`}
          className="absolute inset-0 z-0 overflow-hidden bg-black"
          aria-hidden
        >
          {slide.video && (
            <video
              ref={videoRef}
              src={slide.video}
              autoPlay
              muted
              playsInline
              onTimeUpdate={() => {
                const v = videoRef.current
                if (v && v.duration > 0) setVideoProgress(v.currentTime / v.duration)
              }}
              onEnded={goNext}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {slide.image && (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={slide.image}
                  alt=""
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover blur-3xl brightness-[0.38] saturate-110"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/45" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center px-3">
                <img
                  src={slide.image}
                  alt=""
                  className="pointer-events-none max-h-full max-w-full object-contain drop-shadow-md"
                  draggable={false}
                />
              </div>
            </>
          )}
        </div>

        {/* Bottom fade for legibility - above image layers, below copy */}
        {hasMedia && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-2/3"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)' }}
          />
        )}

        {/* Slide content */}
        <div
          key={current}
          className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-18"
          style={{ animation: 'stories-in 0.25s ease-out' }}
        >
          {/* Step label */}
          {slide.step && (
            <div className="flex items-center z-10 gap-1.5 mb-4 text-[10px] font-bold tracking-[0.14em] uppercase text-accent">
              <span className="w-4 h-px bg-accent" />
              {slide.step}
            </div>
          )}

          {/* Title */}
          <h2 className="text-[22px]  z-10 font-bold leading-tight text-white mb-3">
            {slide.title}
          </h2>

          {/* Body */}
          <p className="text-[15px] z-10 text-text-muted leading-relaxed">
            {slide.body}
          </p>
        </div>

        {/* Tap hint zones (visual, subtle) */}
        <div className="absolute inset-y-0 left-0 w-1/3 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-2/3 pointer-events-none" />
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-1.5 pb-4 z-10 absolute bottom-0 m-auto left-0 right-0">
        {guide.slides.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              background: i === current ? '#D56000' : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
