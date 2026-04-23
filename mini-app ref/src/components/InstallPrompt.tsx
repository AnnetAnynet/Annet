import { useCallback, useEffect, useState } from 'react'

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    const dismissed = sessionStorage.getItem('install-dismissed')
    if (dismissed) return

    if (typeof tg.addToHomeScreen === 'function') {
      setVisible(true)
    }
  }, [])

  const handleInstall = useCallback(() => {
    window.Telegram?.WebApp?.addToHomeScreen?.()
    setVisible(false)
  }, [])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    sessionStorage.setItem('install-dismissed', '1')
  }, [])

  if (!visible) return null

  return (
    <div className="mt-6 bg-bg-card border border-border-card rounded-[4px] p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text">На главный экран</div>
        <div className="text-[10px] text-text-dim leading-snug mt-0.5">Быстрый доступ без Telegram</div>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 text-[10px] font-bold tracking-[0.04em] uppercase text-accent bg-accent-dim border border-accent-border rounded-[3px] px-3 py-1.5 cursor-pointer transition-colors hover:bg-[rgba(213,96,0,0.2)] active:scale-95"
      >
        Добавить
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-text-dim text-sm cursor-pointer hover:text-text-muted transition-colors"
        aria-label="Скрыть"
      >
        ✕
      </button>
    </div>
  )
}
