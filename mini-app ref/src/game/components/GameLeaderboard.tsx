import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLeaderboard, fetchMyStats, updateNickname } from '../../api/endpoints'
import type { LeaderboardEntry, LeaderboardPeriod, PlayerStats } from '../../api/types'

interface GameLeaderboardProps {
  telegramId?: number | null
  nickname?: string | null
  onNicknameChange?: (nickname: string) => void
  /** Increment after a game session so "my stats" and lists refetch. */
  refreshKey?: number
}

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'all', label: 'Все время' },
  { id: 'week', label: 'Неделя' },
  { id: 'day', label: 'Сегодня' },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#FFD700]/15 text-[#FFD700] text-[10px] font-extrabold">
        1
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#C0C0C0]/15 text-[#C0C0C0] text-[10px] font-extrabold">
        2
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#CD7F32]/15 text-[#CD7F32] text-[10px] font-extrabold">
        3
      </span>
    )
  }
  return (
    <span className="w-6 h-6 flex items-center justify-center text-text-dim text-[10px] font-semibold tabular-nums">
      {rank}
    </span>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5"
          style={{ opacity: 1 - i * 0.15 }}
        >
          <div className="w-6 h-6 rounded-full bg-bg-card" />
          <div className="flex-1 h-3 rounded bg-bg-card" />
          <div className="w-14 h-3 rounded bg-bg-card" />
        </div>
      ))}
    </>
  )
}

function MyStatsCard({
  stats,
  loading,
  nickname,
  telegramId,
  onNicknameChange,
}: {
  stats: PlayerStats | null
  loading: boolean
  nickname: string | null | undefined
  telegramId: number | null | undefined
  onNicknameChange?: (nickname: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayNick = stats?.nickname ?? nickname ?? '-'

  const startEdit = () => {
    setDraft(displayNick === '-' ? '' : displayNick)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft('')
  }

  const saveNickname = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed.length > 32 || !telegramId) return
    setSaving(true)
    try {
      await updateNickname(telegramId, trimmed)
      localStorage.setItem(`game_nickname_${telegramId}`, trimmed)
      onNicknameChange?.(trimmed)
      setEditing(false)
    } catch {
      // keep edit open on failure
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveNickname()
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div className="bg-bg-card border border-border rounded-sm p-3 mb-4">
      {/* Nickname row */}
      <div className="flex items-center gap-2 mb-3">
        {editing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={32}
              disabled={saving}
              className="flex-1 min-w-0 bg-bg border border-border rounded-sm px-2 py-1 text-xs text-text outline-none focus:border-accent"
              placeholder="Никнейм"
            />
            <button
              type="button"
              onClick={saveNickname}
              disabled={saving || !draft.trim()}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-accent text-white text-[11px] font-bold cursor-pointer disabled:opacity-40"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-bg border border-border text-text-dim text-[11px] font-bold cursor-pointer disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm font-bold text-text truncate">{displayNick}</span>
            {telegramId && (
              <button
                type="button"
                onClick={startEdit}
                className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-accent cursor-pointer transition-colors"
                title="Сменить никнейм"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 1.5L10.5 3.5M1 11L1.5 8.5L9.5 0.5L11.5 2.5L3.5 10.5L1 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-0.5">
            Лучший забег
          </div>
          {loading ? (
            <div className="h-4 w-16 rounded bg-bg animate-pulse" />
          ) : (
            <div className="text-sm font-bold text-text tabular-nums">
              {stats?.best_distance != null
                ? `${stats.best_distance.toLocaleString('ru-RU')} m`
                : '-'}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-0.5">
            Место
          </div>
          {loading ? (
            <div className="h-4 w-10 rounded bg-bg animate-pulse" />
          ) : (
            <div className="text-sm font-bold text-text tabular-nums">
              {stats?.rank != null ? `#${stats.rank}` : '-'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GameLeaderboard({ telegramId, nickname, onNicknameChange, refreshKey = 0 }: GameLeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [myStats, setMyStats] = useState<PlayerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const load = useCallback(
    (p: LeaderboardPeriod) => {
      setLoading(true)
      setStatsLoading(true)

      fetchLeaderboard(null, p)
        .then(setEntries)
        .catch(() => setEntries([]))
        .finally(() => setLoading(false))

      if (telegramId) {
        fetchMyStats(telegramId, p)
          .then(setMyStats)
          .catch(() => setMyStats(null))
          .finally(() => setStatsLoading(false))
      } else {
        setMyStats(null)
        setStatsLoading(false)
      }
    },
    [telegramId],
  )

  useEffect(() => {
    load(period)
  }, [period, load, refreshKey])

  const handlePeriod = (p: LeaderboardPeriod) => {
    if (p === period) return
    setPeriod(p)
  }

  const currentUserNick = nickname ?? myStats?.nickname ?? undefined

  return (
    <div className="w-full">
      {/* My stats card */}
      {telegramId && (
        <MyStatsCard
          stats={myStats}
          loading={statsLoading}
          nickname={nickname}
          telegramId={telegramId}
          onNicknameChange={onNicknameChange}
        />
      )}

      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriod(p.id)}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm cursor-pointer transition-colors ${
              period === p.id
                ? 'bg-accent text-white'
                : 'bg-bg-card text-text-dim hover:text-text-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="bg-bg-card border border-border rounded-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-3 py-2 border-b border-border text-[9px] font-bold text-text-dim uppercase tracking-widest">
          <span className="w-6 text-center">#</span>
          <span className="flex-1 ml-3">Игрок</span>
          <span className="text-right">Дистанция</span>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="text-2xl opacity-40">🦊</div>
            <div className="text-[11px] text-text-dim">
              {period === 'all'
                ? 'Пока нет результатов'
                : period === 'week'
                  ? 'На этой неделе ещё никто не играл'
                  : 'Сегодня ещё никто не играл'}
            </div>
          </div>
        ) : (
          entries.map((entry, idx) => {
            const rank = entry.rank ?? idx + 1
            const isMe =
              currentUserNick !== undefined &&
              entry.nickname.toLowerCase() === currentUserNick.toLowerCase()

            return (
              <div
                key={`${entry.nickname}-${rank}`}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  isMe
                    ? 'bg-accent-dim border-l-2 border-accent'
                    : idx % 2 === 0
                      ? 'bg-transparent'
                      : 'bg-bg/30'
                }`}
              >
                <RankBadge rank={rank} />
                <span
                  className={`flex-1 text-xs font-semibold truncate ${
                    isMe ? 'text-accent' : 'text-text'
                  }`}
                >
                  {entry.nickname}
                  {isMe && (
                    <span className="ml-1.5 text-[9px] text-accent/60 font-normal">
                      (вы)
                    </span>
                  )}
                </span>
                <span
                  className={`text-xs tabular-nums font-bold ${
                    isMe ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {entry.best_distance.toLocaleString('ru-RU')} m
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
