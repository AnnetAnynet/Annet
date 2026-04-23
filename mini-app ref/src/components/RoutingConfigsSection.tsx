import { useState } from 'react'
import { ROUTING_CONFIGS, APP_META, type RoutingConfig } from '../data/routingConfigs'
import { HudButton } from './HudButton'

import { API_BASE } from '../api/apiBase'

function buildOpenUrl(deeplink: string): string {
  return `${API_BASE}/api/vpn/deeplink/open?target=${encodeURIComponent(deeplink)}`
}

interface RoutingConfigsSectionProps {
  onOpenInApp: (deeplink: string) => void
  onSuggest: () => void
}

const ALL_FILTER = 'all'

function getDistinctApps(): string[] {
  const seen = new Set<string>()
  for (const cfg of ROUTING_CONFIGS) {
    for (const dl of cfg.deeplinks) {
      seen.add(dl.appId)
    }
  }
  return Array.from(seen)
}

export function RoutingConfigsSection({ onOpenInApp, onSuggest }: RoutingConfigsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER)

  const apps = getDistinctApps()

  const filtered =
    activeFilter === ALL_FILTER
      ? ROUTING_CONFIGS
      : ROUTING_CONFIGS.filter(cfg =>
          cfg.deeplinks.some(dl => dl.appId === activeFilter),
        )

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-3 h-px bg-accent" />
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-accent">
          Конфиги
        </span>
      </div>

      <p className="text-xs text-text-muted mb-4 leading-relaxed">
        Готовые настройки маршрутизации для разных приложений - нажмите, чтобы установить напрямую.
      </p>

      {/* App filter tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 mb-4"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <FilterTab
          label="Все"
          logo={null}
          active={activeFilter === ALL_FILTER}
          onClick={() => setActiveFilter(ALL_FILTER)}
        />
        {apps.map(appId => {
          const meta = APP_META[appId]
          if (!meta) return null
          return (
            <FilterTab
              key={appId}
              label={meta.name}
              logo={meta.logo}
              active={activeFilter === appId}
              onClick={() => setActiveFilter(appId)}
            />
          )
        })}
        <div className="shrink-0 w-1" />
      </div>

      {/* Config cards */}
      <div className="space-y-3 mb-5">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-dim text-center py-6">Нет конфигов для выбранного приложения</p>
        ) : (
          filtered.map(cfg => (
            <ConfigCard
              key={cfg.id}
              config={cfg}
              activeFilter={activeFilter}
              onOpenInApp={onOpenInApp}
            />
          ))
        )}
      </div>

      {/* Suggest CTA */}
      <HudButton variant="secondary" onClick={onSuggest}>
        + Предложить свой конфиг
      </HudButton>
    </section>
  )
}

interface FilterTabProps {
  label: string
  logo: string | null
  active: boolean
  onClick: () => void
}

function FilterTab({ label, logo, active, onClick }: FilterTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border text-xs font-semibold
        transition-[border-color,background,color] duration-150 cursor-pointer
        ${active
          ? 'bg-accent-dim border-accent-border text-accent'
          : 'bg-bg-card border-border-card text-text-muted hover:border-accent-border hover:text-text'
        }
      `}
    >
      {logo && (
        <img src={logo} alt="" className="w-4 h-4 rounded-[3px] object-contain" />
      )}
      {label}
    </button>
  )
}

interface ConfigCardProps {
  config: RoutingConfig
  activeFilter: string
  onOpenInApp: (deeplink: string) => void
}

function ConfigCard({ config, activeFilter, onOpenInApp }: ConfigCardProps) {
  const visibleDeeplinks =
    activeFilter === ALL_FILTER
      ? config.deeplinks
      : config.deeplinks.filter(dl => dl.appId === activeFilter)

  return (
    <div className="relative bg-bg-card border border-border-card rounded-[4px] p-4 overflow-hidden group">
      {/* Scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
        }}
      />

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(213,96,0,0.3)' }}
      />

      <div className="relative z-10">
        {/* Name + app badges row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-sm font-bold text-text leading-snug">{config.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {config.deeplinks.map(dl => {
              const meta = APP_META[dl.appId]
              if (!meta) return null
              return (
                <img
                  key={dl.appId}
                  src={meta.logo}
                  alt={meta.name}
                  title={meta.name}
                  className="w-5 h-5 rounded-[3px] object-contain opacity-60"
                />
              )
            })}
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-text-muted leading-relaxed mb-4">
          {config.description}
        </p>

        {/* Deeplink buttons */}
        <div className="flex flex-col gap-2">
          {visibleDeeplinks.map(dl => {
            const meta = APP_META[dl.appId]
            if (!meta) return null
            return (
              <button
                key={dl.appId}
                type="button"
                onClick={() => onOpenInApp(buildOpenUrl(dl.deeplink))}
                className="
                  flex items-center gap-2 w-full px-3 py-2.5
                  bg-[rgba(0,0,0,0.25)] border border-border rounded-[4px]
                  text-xs font-semibold text-text
                  hover:border-accent-border hover:text-accent
                  transition-[border-color,color] duration-150 cursor-pointer
                  active:scale-[0.98]
                "
              >
                <img src={meta.logo} alt={meta.name} className="w-5 h-5 rounded-[3px] object-contain" />
                <span>Открыть в {meta.name}</span>
                <span className="ml-auto text-text-dim text-[10px]">→</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
