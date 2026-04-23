import { useEffect, useState } from 'react'
import { fetchReportStats } from '../api/endpoints'
import type { HourlyBucket, IncidentBreakdownRow, ReportStatsResponse } from '../api/types'

const STATS_REFRESH_MS = 30_000

// ─── Shared card shell ───────────────────────────────────────────────────────

function StatCard({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-[rgba(213,96,0,0.18)] rounded-[4px] p-4 relative overflow-hidden">
      <i className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-accent" />
      <i className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-accent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent mb-3">
          <span className="w-3 h-px bg-accent" />
          {tag}
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Breakdown list (connection / provider / city) ───────────────────────────

function BreakdownList({ rows, emptyText }: { rows: IncidentBreakdownRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="text-[11px] text-text-dim">{emptyText}</p>
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((row, i) => (
        <li key={i} className="flex justify-between gap-3 text-xs">
          <span className="text-text-dim leading-snug">{row.label}</span>
          <span className="font-mono font-semibold text-text shrink-0">{row.count}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IncidentDashboard() {
  const [stats, setStats] = useState<ReportStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await fetchReportStats()
      setStats(data)
    } catch {
      // silently fail - chart stays empty
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, STATS_REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  const buckets: HourlyBucket[] = stats?.buckets ?? Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    vpn_count: 0,
    mtproto_count: 0,
    total: 0,
  }))

  const maxTotal = Math.max(...buckets.map(b => b.total), 1)
  const CHART_H = 80
  const BAR_GAP = 2
  const totalBars = buckets.length
  const barWidth = `calc((100% - ${(totalBars - 1) * BAR_GAP}px) / ${totalBars})`

  return (
    <div className="space-y-3">
      {/* ── Block 1: totals + chart ─────────────────────────────────────── */}
      <StatCard tag="Сбои за 24 часа">
        {/* Auto-refresh hint + legend */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="text-[10px] text-text-dim leading-snug">
            Автообновление каждые 30 с
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent inline-block" />
              <span className="text-[9px] text-text-dim uppercase tracking-widest">VPN</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#4a7fcc] inline-block" />
              <span className="text-[9px] text-text-dim uppercase tracking-widest">MTProto</span>
            </div>
          </div>
        </div>

        {/* Numeric totals */}
        <div className="flex gap-4 mb-4">
          <div>
            <div className="text-lg font-extrabold text-text leading-none">{stats?.grand_total ?? 0}</div>
            <div className="text-[9px] text-text-dim tracking-widest uppercase mt-0.5">всего</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-base font-bold text-accent leading-none">{stats?.vpn_total ?? 0}</div>
            <div className="text-[9px] text-text-dim tracking-widest uppercase mt-0.5">VPN</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-base font-bold text-[#4a7fcc] leading-none">{stats?.mtproto_total ?? 0}</div>
            <div className="text-[9px] text-text-dim tracking-widest uppercase mt-0.5">MTProto</div>
          </div>
        </div>

        {/* Bar chart */}
        {loading ? (
          <div className="flex items-end gap-[2px]" style={{ height: CHART_H }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-[rgba(255,255,255,0.05)] rounded-t-[2px]"
                style={{ height: `${(i % 7) * 8 + 10}%`, opacity: 0.3 }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-end" style={{ height: CHART_H, gap: BAR_GAP }}>
            {buckets.map((bucket, i) => {
              const vpnH = maxTotal > 0 ? (bucket.vpn_count / maxTotal) * CHART_H : 0
              const mH = maxTotal > 0 ? (bucket.mtproto_count / maxTotal) * CHART_H : 0
              const emptyH = CHART_H - vpnH - mH
              const hasAny = bucket.total > 0
              return (
                <div
                  key={i}
                  className="flex flex-col justify-end"
                  style={{ width: barWidth, height: CHART_H, flexShrink: 0 }}
                  title={`${bucket.hour}:00 - VPN: ${bucket.vpn_count}, MTProto: ${bucket.mtproto_count}`}
                >
                  {!hasAny ? (
                    <div
                      className="w-full rounded-t-[2px]"
                      style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}
                    />
                  ) : (
                    <>
                      {emptyH > 0 && <div style={{ height: emptyH }} />}
                      {mH > 0 && (
                        <div
                          className="w-full"
                          style={{ height: mH, background: '#3a6ab2', borderRadius: vpnH > 0 ? 0 : '2px 2px 0 0' }}
                        />
                      )}
                      {vpnH > 0 && (
                        <div
                          className="w-full"
                          style={{ height: vpnH, background: '#D56000', borderRadius: '2px 2px 0 0' }}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Hour labels */}
        <div className="flex justify-between mt-1.5">
          {[0, 6, 12, 18, 23].map(h => (
            <span key={h} className="text-[8px] text-text-dim font-mono">
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>
      </StatCard>

      {/* ── Block 2: connection type ─────────────────────────────────────── */}
      {!loading && (
        <StatCard tag="Тип подключения (VPN)">
          <BreakdownList
            rows={stats?.by_connection_type ?? []}
            emptyText="Нет отчётов с типом подключения за 24 ч"
          />
        </StatCard>
      )}

      {/* ── Block 3: providers ──────────────────────────────────────────── */}
      {!loading && (
        <StatCard tag="Провайдер (мобильный интернет)">
          <BreakdownList
            rows={stats?.by_provider ?? []}
            emptyText="Нет отчётов с указанным провайдером за 24 ч"
          />
        </StatCard>
      )}

      {/* ── Block 4: cities ─────────────────────────────────────────────── */}
      {!loading && (
        <StatCard tag="Города">
          <BreakdownList
            rows={stats?.by_city ?? []}
            emptyText="Нет отчётов с указанным городом за 24 ч"
          />
        </StatCard>
      )}
    </div>
  )
}
