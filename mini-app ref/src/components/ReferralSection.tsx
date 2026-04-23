import { useMemo, useState } from 'react'
import type { InvitedFriend } from '../api/types'
import { resolveInviteLink } from '../utils/inviteLink'
import { HudCard } from './HudCard'
import { HudButton } from './HudButton'
import { InviteRow } from './InviteRow'
import { ReferralBoostNotice } from './ReferralBoostNotice'

const PREVIEW_LIMIT = 3

function pluralInvites(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'приглашение'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'приглашения'
  return 'приглашений'
}

function paidLabel(count: number): string {
  if (count === 0) return '0 оплатили'
  if (count === 1) return '1 оплатил'
  return `${count} оплатили`
}

interface ReferralSectionProps {
  code: string
  referralLink: string | null
  friends: number
  invitedPaidCount: number
  bonusDays: number
  bonusDaysPerReferral: number
  referralInviteeBonusDays: number
  invitedFriends: InvitedFriend[]
  onShare?: () => void
  onViewAll?: () => void
}

export function ReferralSection({
  code,
  referralLink,
  friends,
  invitedPaidCount,
  bonusDays,
  bonusDaysPerReferral,
  referralInviteeBonusDays,
  invitedFriends,
  onShare,
  onViewAll,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false)

  const inviteLink = useMemo(() => resolveInviteLink(code, referralLink), [code, referralLink])

  const handleCopy = () => {
    const text = inviteLink ?? (code !== '-' ? code : '')
    if (!text) return
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const preview = invitedFriends.slice(0, PREVIEW_LIMIT)
  const showViewAll = invitedFriends.length > PREVIEW_LIMIT

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-4 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
        <span className="w-3 h-px bg-accent" />
        Пригласи друга
      </div>

      <ReferralBoostNotice active={referralInviteeBonusDays > 0} className="mb-3" />

      <HudCard serial="REF" className="mb-3">
        <div className="text-[9px] font-bold tracking-widest uppercase text-text-dim mb-2">
          Ссылка-приглашение
        </div>
        <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.3)] border border-accent-border rounded-[4px] p-3.5 mb-2">
          <span
            className="flex-1 min-w-0 font-mono text-[13px] sm:text-sm font-semibold tracking-[0.02em] text-accent break-all"
            title={inviteLink ?? code}
          >
            {inviteLink ?? code}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={code === '-' && !inviteLink}
            className="shrink-0 bg-accent-dim border border-accent-border rounded-[4px] px-2.5 py-1.5 text-[11px] font-bold text-accent cursor-pointer transition-colors hover:bg-[rgba(213,96,0,0.2)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? 'Готово' : 'Копировать'}
          </button>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed mb-3">
          Друг перейдёт по ссылке и выберет удобный формат входа.
        </p>

        {/* Reward loot card */}
        <div className="flex items-stretch gap-0 mb-3 rounded-[4px] overflow-hidden border border-accent-border">
          <div className="flex flex-col items-center justify-center px-4 py-3 bg-accent-dim">
            <span className="text-[26px] font-extrabold text-accent leading-none">+{bonusDaysPerReferral}</span>
            <span className="text-[9px] font-bold text-accent/70 uppercase tracking-wider mt-0.5">дней</span>
          </div>
          <div className="flex flex-col justify-center px-3.5 py-3 bg-[rgba(0,0,0,0.25)] flex-1 min-w-0">
            <span className="text-[11px] font-bold text-text leading-tight">Награда за приглашение</span>
            <span className="text-[10px] text-text-dim leading-tight mt-0.5">
              {referralInviteeBonusDays > 0
                ? `Первая оплата друга: +${bonusDaysPerReferral} дн. вам и +${referralInviteeBonusDays} дн. другу`
                : `После первой оплаты приглашённого вам +${bonusDaysPerReferral} дн.`}
            </span>
          </div>
        </div>

        <HudButton variant="secondary" onClick={onShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.28c-.146.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.984 13.64l-2.961-.924c-.644-.204-.657-.643.135-.953l11.571-4.461c.537-.194 1.006.131.833.946z"/>
          </svg>
          Отправить приглашение
        </HudButton>
      </HudCard>

      {friends === 0 ? (
        <HudCard>
          <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-text-dim mb-2.5">
            Пока пусто
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            Пока никого нет. Отправь ссылку - как только друг оплатит первую подписку, бонус придёт автоматически.
          </p>
        </HudCard>
      ) : (
        <HudCard>
          {/* Заголовок карточки */}
          <div className="flex items-center gap-1.5 mb-3 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
            <span className="w-3 h-px bg-accent shrink-0" />
            Приглашения
          </div>

          {/* Статистика */}
          <div className="flex items-end justify-between gap-2 mb-3">
            <div className="space-y-0.5">
              <p className="text-[22px] font-extrabold text-text leading-none">{friends}</p>
              <p className="text-[10px] text-text-muted">{pluralInvites(friends)} · {paidLabel(invitedPaidCount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-extrabold text-accent leading-none">+{bonusDays}</p>
              <p className="text-[10px] text-text-muted">дн. бонусом</p>
            </div>
          </div>

          <div className="mb-2">
            {preview.map((f, i) => (
              <InviteRow key={`${f.username ?? 'u'}-${i}`} friend={f} />
            ))}
          </div>

          {showViewAll && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full text-center text-[11px] font-bold text-accent py-2 cursor-pointer hover:opacity-90 transition-opacity"
            >
              Все приглашения ({invitedFriends.length})
            </button>
          )}

          <p className="text-[10px] text-text-dim leading-relaxed mt-2">
            Бонус начисляется после первой оплаты приглашённого
          </p>
        </HudCard>
      )}
    </section>
  )
}
