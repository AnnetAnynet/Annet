import { HudCard } from './HudCard'

interface DevicesBlockProps {
  deviceCount: number
  onOpen: () => void
}

function DevicesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="16" rx="2" />
      <path d="M12 18h.01" />
      <rect x="2" y="20" width="20" height="2" rx="1" />
    </svg>
  )
}

export function DevicesBlock({ deviceCount, onOpen }: DevicesBlockProps) {
  return (
    <HudCard tag="Устройства">
      <p className="text-xs text-text-dim leading-relaxed mb-3">
        {deviceCount > 0
          ? `Управляйте устройствами. Продали телефон - отключите за секунду.`
          : 'Продали или потеряли телефон? Создайте отдельную ссылку для каждого устройства и отключайте любое в один клик.'
        }
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="
          w-full flex items-center justify-center gap-2 py-3 px-4
          bg-bg border border-border-card rounded-[4px]
          text-xs font-bold text-text-muted uppercase tracking-[0.06em]
          cursor-pointer transition-colors
          hover:border-accent-border hover:text-accent
          active:scale-[0.98]
        "
      >
        <DevicesIcon />
        {deviceCount > 0 ? `Мои устройства (${deviceCount})` : 'Управление устройствами'}
      </button>
    </HudCard>
  )
}
