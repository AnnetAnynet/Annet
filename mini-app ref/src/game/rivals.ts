import type { RivalRole, RivalRosterEntry } from '../api/types'

export type { RivalRole }

/**
 * In-game rival. Built from the server-curated roster (`/api/game/rivals`).
 * Roles are assigned server-side; the client only renders/labels them.
 */
export interface Rival {
  role: RivalRole
  nickname: string
  bestDistance: number
  /** True only for the PB-ghost (the player's own previous best). */
  isSelf: boolean
  rankDay?: number
  rankWeek?: number
  rankAll?: number
}

/** Convert a backend RivalRosterEntry (snake_case) into the client Rival shape. */
export function fromRosterEntry(entry: RivalRosterEntry): Rival {
  return {
    role: entry.role,
    nickname: entry.nickname,
    bestDistance: entry.best_distance,
    isSelf: entry.is_self,
    rankDay: entry.rank_day ?? undefined,
    rankWeek: entry.rank_week ?? undefined,
    rankAll: entry.rank_all ?? undefined,
  }
}

/** Short HUD/Game-Over badge label for a role. */
export function roleLabel(rival: Rival): string {
  switch (rival.role) {
    case 'pb':
      return 'PB'
    case 'day_leader':
      return 'DAY #1'
    case 'week_leader':
      return 'WEEK #1'
    case 'all_leader':
      return 'TOP #1'
    case 'stretch':
      return 'STRETCH'
    case 'rotation':
    default:
      return 'RIVAL'
  }
}

/**
 * Visual "tone" hint for the role badge.
 * - `self`: cold/muted accent for PB-ghost (your own shadow)
 * - `leader`: bright accent for #1 slots (day/week/all)
 * - `rival`: default accent for stretch/rotation
 */
export type RoleTone = 'self' | 'leader' | 'rival'

export function roleBadgeTone(rival: Rival): RoleTone {
  if (rival.isSelf || rival.role === 'pb') return 'self'
  if (
    rival.role === 'day_leader' ||
    rival.role === 'week_leader' ||
    rival.role === 'all_leader'
  ) {
    return 'leader'
  }
  return 'rival'
}

/** True if this rival occupies one of the "#1" slots. */
export function isLeader(rival: Rival): boolean {
  return (
    rival.role === 'day_leader' ||
    rival.role === 'week_leader' ||
    rival.role === 'all_leader'
  )
}
