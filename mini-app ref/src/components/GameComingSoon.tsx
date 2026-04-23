interface GameComingSoonProps {
  /** Карточка на главной или полноэкранный блок во вкладке «Игра». */
  variant?: 'home' | 'tab'
}

export function GameComingSoon({ variant = 'tab' }: GameComingSoonProps) {
  const isHome = variant === 'home'

  return (
    <div
      className={
        isHome
          ? 'w-full rounded-sm border border-border bg-bg-card p-4 flex flex-col items-center gap-3 text-center'
          : 'flex flex-col items-center justify-center min-h-[50vh] gap-4 px-5 text-center'
      }
    >
      <div className="text-4xl">🦊</div>
      <div className="text-sm font-bold text-accent tracking-wide">Annet Runner</div>
      <p className="text-xs text-text-muted leading-relaxed max-w-sm">
        Игра в разработке. Скоро она станет доступна всем - с призами и бонусами для участников.
      </p>
    </div>
  )
}
