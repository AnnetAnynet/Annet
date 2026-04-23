import { useCallback, useEffect, useState } from 'react'
import type { InvitedFriend } from '../api/types'
import { InviteRow } from './InviteRow'
import { ReferralBoostNotice } from './ReferralBoostNotice'

const ANIM_MS = 300

interface FriendsScreenProps {
  open: boolean
  onClose: () => void
  friends: InvitedFriend[]
  bonusDays: number
  bonusDaysPerReferral: number
  referralInviteeBonusDays: number
  invitedPaidCount: number
  totalCount: number
}

export function FriendsScreen({
  open,
  onClose,
  friends,
  bonusDays,
  bonusDaysPerReferral,
  referralInviteeBonusDays,
  invitedPaidCount,
  totalCount,
}: FriendsScreenProps) {
  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    setClosing(true)
  }, [])

  useEffect(() => {
    if (!closing) return
    const t = window.setTimeout(() => {
      onClose()
    }, ANIM_MS)
    return () => window.clearTimeout(t)
  }, [closing, onClose])

  useEffect(() => {
    if (open) setClosing(false)
  }, [open])

  if (!open) return null

  const panelAnim = closing ? 'slide-right-out' : 'slide-right-in'

  return (
    <div className="fixed inset-0 z-110 flex flex-col bg-bg overflow-hidden">
      <div
        className="flex flex-col flex-1 min-h-0 w-full bg-bg"
        style={{
          animation: `${panelAnim} ${ANIM_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <header className="shrink-0 pt-4 px-4 pb-3 border-b border-border-card flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-text-muted hover:text-accent cursor-pointer transition-colors py-2 -ml-1"
          >
            ← Назад
          </button>
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
            <span className="w-3 h-px bg-accent" />
            Приглашения · {totalCount}
          </div>
        </header>

        <div className="px-4 pt-4 pb-2 shrink-0">
          <ReferralBoostNotice active={referralInviteeBonusDays > 0} className="mb-3" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            {invitedPaidCount} оплатили · +{bonusDays} дн. бонусом
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
          {friends.length === 0 ? (
            <p className="text-xs text-text-dim py-6">Список пуст.</p>
          ) : (
            friends.map((f, i) => (
              <InviteRow key={`${f.username ?? 'u'}-${i}`} friend={f} />
            ))
          )}
        </div>

        <p className="shrink-0 px-4 pb-6 text-[10px] text-text-dim text-center border-t border-border-card pt-3">
          {referralInviteeBonusDays > 0
            ? `+${bonusDaysPerReferral} дн. вам и +${referralInviteeBonusDays} дн. приглашённому после первой оплаты`
            : `+${bonusDaysPerReferral} дн. вам после первой оплаты приглашённого`}
        </p>
      </div>
    </div>
  )
}
