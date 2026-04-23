interface ReferralBoostNoticeProps {
  /** Пока API отдаёт усиленный бонус (дни приглашённому больше нуля). */
  active: boolean
  className?: string
}

export function ReferralBoostNotice({ active, className = '' }: ReferralBoostNoticeProps) {
  if (!active) return null

  return (
    <div
      className={`rounded-[4px] border border-accent-border bg-[rgba(0,0,0,0.22)] px-3.5 py-3 ${className}`}
    >
      <p className="text-[9px] font-bold tracking-widest uppercase text-accent mb-2">
        Ограниченное предложение
      </p>
      <p className="text-[10px] text-text-muted leading-relaxed">
        <span className="font-bold text-text">С 20 по 26 апреля</span> включительно - усиленный бонус. Он срабатывает,
        если приглашённый оплатит{' '}
        <span className="font-bold text-text">первую</span> подписку в этот период (по времени фактической оплаты).
      </p>
    </div>
  )
}
