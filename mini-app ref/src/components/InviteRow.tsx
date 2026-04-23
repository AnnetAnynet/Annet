import type { InvitedFriend } from '../api/types'

export function InviteRow({ friend }: { friend: InvitedFriend }) {
  const initial = friend.username?.[0]?.toUpperCase() ?? '?'
  const handle = friend.username ? `@${friend.username}` : 'без username'

  return (
    <div className="flex items-center gap-2.5 min-w-0 py-2 border-b border-border-card last:border-b-0">
      <span
        className={`
          shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold
          ${friend.bonus_applied
            ? 'bg-accent text-white'
            : 'bg-bg-card border border-accent-border text-accent/60'}
        `}
      >
        {initial}
      </span>
      <span className="flex-1 min-w-0 font-mono text-[12px] font-semibold text-text truncate">
        {handle}
      </span>
      <span
        className={`shrink-0 text-[10px] font-semibold whitespace-nowrap ${friend.bonus_applied ? 'text-accent' : 'text-text-dim'}`}
      >
        {friend.bonus_applied ? '● Оплатил' : '○ Ждёт оплаты'}
      </span>
    </div>
  )
}
