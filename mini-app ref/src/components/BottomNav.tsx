import type { ComponentType } from 'react'

export type TabId = 'home' | 'mtproto' | 'reports' | 'referral' | 'game'

interface BottomNavProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string; Icon: ComponentType }[] = [
  { id: 'home', label: 'Главная', Icon: HomeIcon },
  { id: 'referral', label: 'Рефералы', Icon: ReferralIcon },
  { id: 'reports', label: 'Отчёты', Icon: ReportsIcon },
  { id: 'mtproto', label: 'Прокси', Icon: MtProtoIcon },
  { id: 'game', label: 'Игра', Icon: GameIcon },
]

function MtProtoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ReferralIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function GameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4" />
      <path d="M8 10v4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-border">
      <div className="flex">
        {TABS.map(tab => {
          const active = tab.id === activeTab
          const Icon = tab.Icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer
                transition-colors duration-150
                ${active ? 'text-accent' : 'text-text-dim hover:text-text-muted'}
              `}
            >
              <Icon />
              <span className={`text-[9px] font-bold tracking-[0.06em] uppercase leading-none ${active ? 'text-accent' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-accent rounded-full" style={{ position: 'unset' }} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
