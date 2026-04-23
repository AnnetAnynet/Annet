interface HeroFoxProps {
  variant: 'active' | 'welcome' | 'waiting' | 'loading'
}

/** Пробел в имени файла - корректный URL */
const FLYING_FOX_SRC = `/assets/${encodeURIComponent('Annet Fox.webp')}`

const FOX_CONFIG = {
  loading: {
    src: FLYING_FOX_SRC,
    glow: 'radial-gradient(ellipse, rgba(213,96,0,0.16), transparent 58%)',
    filter: 'drop-shadow(0 20px 48px rgba(213,96,0,0.32))',
    animation: 'fox-fly 3.2s ease-in-out infinite',
  },
  waiting: {
    src: '/assets/fox-waiting.webp',
    glow: 'radial-gradient(ellipse, rgba(213,96,0,0.12), transparent 62%)',
    filter: 'drop-shadow(0 16px 40px rgba(213,96,0,0.24))',
    animation: 'fox-float 4.5s ease-in-out infinite',
  },
  welcome: {
    src: '/assets/fox-welcome.webp',
    glow: 'radial-gradient(ellipse, rgba(213,96,0,0.14), transparent 62%)',
    filter: 'drop-shadow(0 16px 40px rgba(213,96,0,0.28))',
    animation: '',
  },
  active: {
    src: '/assets/fox-hero.webp',
    glow: 'radial-gradient(ellipse, rgba(213,96,0,0.10), transparent 65%)',
    filter: 'drop-shadow(0 16px 40px rgba(213,96,0,0.28))',
    animation: 'fox-float 4.5s ease-in-out infinite',
  },
}

export function HeroFox({ variant }: HeroFoxProps) {
  const cfg = FOX_CONFIG[variant]

  return (
    <div className="relative flex justify-center pt-2 pb-0 " >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: cfg.glow }}
      />

      <div className="relative">
    {/*     <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-4 rounded-[50%]"
          style={{ background: 'radial-gradient(ellipse, rgba(213,96,0,0.22), transparent 70%)' }}
        /> */}

        <img
          src={cfg.src}
          alt="Annet Fox"
          className={` h-[40vh] select-none pointer-events-none`}
          style={{
            animation: cfg.animation,
            filter: cfg.filter,
          }}
        />
      </div>
    </div>
  )
}
