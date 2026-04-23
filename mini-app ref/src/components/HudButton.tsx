import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface HudButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export function HudButton({ children, variant = 'primary', className = '', ...props }: HudButtonProps) {
  const cut = '10px'

  const clipPath = `polygon(
    ${cut} 0, calc(100% - ${cut}) 0,
    100% ${cut}, 100% calc(100% - ${cut}),
    calc(100% - ${cut}) 100%, ${cut} 100%,
    0 calc(100% - ${cut}), 0 ${cut}
  )`

  const base = `
    relative flex items-center justify-center gap-2 w-full
    py-3.5 px-6 border-none font-extrabold tracking-[0.04em] uppercase
    text-white cursor-pointer select-none isolate
    transition-[transform,filter] duration-200 ease-out
    active:scale-[0.98]
  `

  const primary = `
    text-sm
    [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]
    [filter:drop-shadow(0_4px_14px_rgba(213,96,0,0.38))]
    hover:[filter:drop-shadow(0_8px_26px_rgba(213,96,0,0.55))]
    hover:-translate-y-0.5
  `

  const secondary = `
    text-xs font-bold normal-case tracking-[0.02em]
    [filter:drop-shadow(0_3px_12px_rgba(213,96,0,0.2))]
    hover:[filter:drop-shadow(0_6px_22px_rgba(213,96,0,0.42))]
    hover:-translate-y-0.5
  `

  const bgPrimary: React.CSSProperties = {
    clipPath,
    background: 'linear-gradient(105deg, #f07820 0%, #D56000 28%, #b84e00 62%, #e86810 100%)',
    backgroundSize: '260% 100%',
    animation: 'hud-shift 5s ease-in-out infinite',
  }

  const bgSecondary: React.CSSProperties = {
    clipPath,
    background: 'linear-gradient(168deg, #242424, #151515 48%, #1c1c1c)',
    boxShadow: 'inset 0 0 0 1px rgba(213,96,0,0.4)',
  }

  return (
    <button
      className={`${base} ${variant === 'primary' ? primary : secondary} ${className}`}
      style={variant === 'primary' ? bgPrimary : bgSecondary}
      {...props}
    >
      {/* Scanline overlay */}
      <span
        className="absolute inset-0 opacity-35 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)',
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
