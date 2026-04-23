import { useCallback, useState } from 'react'
import { activatePromoCode, previewPayment } from '../api/endpoints'
import type { ActivatePromoCodeResult, PaymentPreviewResult, SoloUnlimitedUpgradePreview } from '../api/types'
import { HudButton } from './HudButton'
import { PlanPriceBlock } from './PlansSection'

interface Plan {
  id: number
  period: string
  price: number
  listPriceRub?: number | null
  badge: string | null
  perMonth: string | null
  savingsHint?: string | null
  popular?: boolean
  dataLimitGb?: number | null
  maxDevices?: number | null
}

interface PaymentSheetProps {
  open: boolean
  onClose: () => void
  planId: number | null
  plans: Plan[]
  telegramId: number | null
  /** Solo → Unlimited: server quote; hides promo block and shows upgrade copy. */
  soloUpgradeQuote?: SoloUnlimitedUpgradePreview | null
  onPay?: (provider: 'yookassa' | 'cryptobot', promoCode?: string | null) => void
  /** Текст ошибки оплаты (показывается над способами оплаты). */
  payError?: string | null
  /** Показать кнопку перехода в поддержку с черновиком запроса кода приглашения. */
  showSupportInviteButton?: boolean
  onOpenSupportInvite?: () => void
  onActivateAccessCode?: (code: string) => Promise<boolean>
  accessCodeLoading?: boolean
  accessCodeError?: string | null
  onAccessCodeErrorChange?: () => void
}

export function PaymentSheet({
  open,
  onClose,
  planId,
  plans,
  telegramId,
  soloUpgradeQuote = null,
  onPay,
  payError,
  showSupportInviteButton,
  onOpenSupportInvite,
  onActivateAccessCode,
  accessCodeLoading = false,
  accessCodeError,
  onAccessCodeErrorChange,
}: PaymentSheetProps) {
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoApplied, setPromoApplied] = useState<ActivatePromoCodeResult | null>(null)
  const [discountApplied, setDiscountApplied] = useState<(PaymentPreviewResult & { code: string }) | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [accessCodeInput, setAccessCodeInput] = useState('')
  const [accessCodeActivated, setAccessCodeActivated] = useState(false)

  const handleActivatePromo = useCallback(async () => {
    if (!telegramId || !promoInput.trim() || !planId) return
    setPromoLoading(true)
    setPromoError(null)
    const code = promoInput.trim().toUpperCase()
    try {
      const preview = await previewPayment(planId, code)
      if (preview.type === 'discount') {
        setDiscountApplied({ ...preview, code })
        setPromoInput('')
      } else {
        // Days-based code: activate immediately
        const result = await activatePromoCode(telegramId, code)
        setPromoApplied(result)
        setPromoInput('')
      }
    } catch (err: unknown) {
      const raw = (err as { detail?: string })?.detail ?? ''
      let msg = 'Не удалось проверить промокод'
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.detail) msg = parsed.detail
      } catch {
        if (raw) msg = raw
      }
      setPromoError(msg)
    } finally {
      setPromoLoading(false)
    }
  }, [telegramId, planId, promoInput])

  const handleClose = useCallback(() => {
    setPromoInput('')
    setPromoApplied(null)
    setDiscountApplied(null)
    setPromoError(null)
    setAccessCodeInput('')
    setAccessCodeActivated(false)
    onAccessCodeErrorChange?.()
    onClose()
  }, [onAccessCodeErrorChange, onClose])

  const handleActivateAccessCode = useCallback(async () => {
    if (!onActivateAccessCode) return
    const code = accessCodeInput.trim()
    if (!code || accessCodeLoading || accessCodeActivated) return

    const activated = await onActivateAccessCode(code)
    if (activated) {
      setAccessCodeInput('')
      setAccessCodeActivated(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      handleClose()
    }
  }, [onActivateAccessCode, accessCodeInput, accessCodeLoading, accessCodeActivated, handleClose])

  if (!open || !planId) return null

  const plan = plans.find(p => p.id === planId)
  if (!plan) return null

  const isSoloUpgrade = soloUpgradeQuote != null
  const displayPrice = isSoloUpgrade
    ? soloUpgradeQuote.amount_rub
    : (discountApplied?.discounted_rub ?? plan.price)
  const displayListPrice = isSoloUpgrade
    ? soloUpgradeQuote.full_price_rub
    : (discountApplied ? plan.price : (plan.listPriceRub ?? null))

  return (
    <div className="fixed inset-0 z-130">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-bg-alt rounded-t-2xl"
        style={{ animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Handle */}
        <div className="pt-3 pb-2 px-5">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
              <span className="w-3 h-px bg-accent" />
              {isSoloUpgrade ? 'Апгрейд с Solo' : 'Оплата'}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-bg-card border border-border-card flex items-center justify-center text-text-muted text-sm cursor-pointer hover:border-accent-border transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 pb-10">
          {/* Selected plan summary */}
          <div className="bg-bg-card border border-border-card rounded-[4px] p-4 mb-4 text-center">
            <div className="text-[11px] text-text-muted font-semibold mb-1">{plan.period}</div>
            <PlanPriceBlock
              price={displayPrice}
              listPriceRub={displayListPrice}
              align="center"
              size="sheet"
            />
            {plan.perMonth && !discountApplied && !isSoloUpgrade && (
              <div className="text-[10px] text-text-dim mt-1">{plan.perMonth}</div>
            )}
            {isSoloUpgrade && (
              <div className="text-sm text-text-dim mt-2 space-y-1 text-left mx-auto leading-snug">
                <p>
                  Учтены оставшиеся {soloUpgradeQuote.remaining_days_solo} дн. Solo: −
                  {soloUpgradeQuote.credit_rub.toLocaleString('ru-RU')} ₽ к цене безлимита.
                </p>
                <p>
                  Безлимит на {soloUpgradeQuote.unlimited_period_days} дн. с момента оплаты. Оставшиеся дни Solo не
                  добавляются к сроку - только уменьшают стоимость перехода.
                </p>
              </div>
            )}
            {discountApplied && (
              <div className="text-[10px] text-green-400 mt-1 font-semibold">
                −{discountApplied.discount_amount_rub} ₽ со скидкой
              </div>
            )}
            {plan.savingsHint && !discountApplied && !isSoloUpgrade && (
              <p className="mt-2 rounded-[3px] border border-accent-border/25 bg-accent-dim/35 px-2 py-1.5 text-center text-[10px] font-medium leading-snug text-text-muted text-balance">
                {plan.savingsHint}
              </p>
            )}
            {plan.dataLimitGb != null && (
              <div className="flex justify-center gap-2 mt-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wide text-text-dim bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[3px] px-2 py-0.5">
                  {plan.dataLimitGb} ГБ/мес
                </span>
                {plan.maxDevices != null && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-text-dim bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[3px] px-2 py-0.5">
                    {plan.maxDevices} устройство
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Promo code section */}
          {isSoloUpgrade ? null : discountApplied ? (
            <div className="flex items-center justify-between gap-2.5 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] rounded-[4px] p-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.15)] flex items-center justify-center text-green-400 text-sm shrink-0">
                  %
                </div>
                <div>
                  <div className="text-xs font-semibold text-green-400">
                    Скидка −{discountApplied.discount_amount_rub} ₽
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5 font-mono">
                    {discountApplied.code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setDiscountApplied(null); setPromoInput('') }}
                className="text-[10px] text-text-muted hover:text-red-400 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : promoApplied ? (
            <div className="flex items-center gap-2.5 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] rounded-[4px] p-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.15)] flex items-center justify-center text-green-400 text-sm shrink-0">
                +
              </div>
              <div>
                <div className="text-xs font-semibold text-green-400">
                  +{promoApplied.days} дней к защите трафика
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">
                  Промокод применён
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value); setPromoError(null) }}
                  placeholder="Промокод"
                  className="flex-1 px-3 py-2.5 rounded-[4px] text-sm text-text bg-bg-card border border-border-card outline-none placeholder-text-dim"
                />
                <button
                  type="button"
                  onClick={handleActivatePromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-4 py-2.5 rounded-[4px] text-xs font-bold text-accent bg-bg-card border border-border-card cursor-pointer active:opacity-80 transition-opacity disabled:opacity-30 hover:border-accent-border"
                >
                  {promoLoading ? '...' : 'Применить'}
                </button>
              </div>
              {promoError && (
                <div className="text-[11px] text-red-400 mt-1.5 pl-1">{promoError}</div>
              )}
            </div>
          )}

          {payError && (
            <div className="mb-4 rounded-[4px] border border-red-500/35 bg-[rgba(239,68,68,0.08)] px-3 py-2.5">
              <p className="text-[12px] text-red-300 leading-snug">{payError}</p>
              {showSupportInviteButton && (
                <div className="mt-3 rounded-[4px] border border-accent-border/50 bg-bg-card p-3">
                  <p className="text-[11px] font-semibold text-text mb-2">
                    Для оплаты нужен код доступа
                  </p>
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await handleActivateAccessCode()
                    }}
                  >
                    <input
                      type="text"
                      value={accessCodeInput}
                      disabled={accessCodeActivated}
                      onChange={(e) => {
                        setAccessCodeInput(e.target.value)
                        onAccessCodeErrorChange?.()
                      }}
                      placeholder="Введите код"
                      className="flex-1 w-1 px-3 py-2 rounded-[4px] text-xs text-text bg-bg border border-border-card outline-none placeholder-text-dim focus:border-accent-border"
                    />
                    <button
                      type="submit"
                      disabled={accessCodeLoading || accessCodeActivated || !accessCodeInput.trim()}
                      className="px-3 py-2 rounded-[4px] text-[11px] font-bold text-white bg-accent cursor-pointer active:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      {accessCodeActivated ? 'Готово' : accessCodeLoading ? '...' : 'Активировать'}
                    </button>
                  </form>
                  {accessCodeActivated && (
                    <p className="text-[11px] text-green-300 mt-2">Код принят. Закрываем окно оплаты...</p>
                  )}
                  {accessCodeError && (
                    <p className="text-[11px] text-red-300 mt-2">{accessCodeError}</p>
                  )}
                  {onOpenSupportInvite && (
                    <button
                      type="button"
                      onClick={() => onOpenSupportInvite()}
                      className="mt-2.5 w-full py-2 rounded-[4px] text-[11px] font-bold text-accent bg-bg border border-accent-border cursor-pointer active:opacity-90"
                    >
                      Написать в поддержку
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment methods */}
          <div className="space-y-2 mb-5">
            <PaymentOption
              icon="💳"
              label="Банковская карта"
              hint="Visa, MasterCard, МИР"
              onClick={() => onPay?.('yookassa', isSoloUpgrade ? null : (discountApplied?.code ?? null))}
            />
            <PaymentOption
              icon="₿"
              label="Криптовалюта"
              hint="USDT, TON, BTC"
              onClick={() => onPay?.('cryptobot', isSoloUpgrade ? null : (discountApplied?.code ?? null))}
            />
          </div>

          <HudButton variant="secondary" onClick={handleClose}>
            Отмена
          </HudButton>
        </div>
      </div>
    </div>
  )
}

function PaymentOption({ icon, label, hint, onClick }: {
  icon: string
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-3 bg-bg-card border border-border-card
        rounded-[4px] p-3.5 cursor-pointer text-left
        transition-[border-color,transform] duration-200
        hover:border-accent-border hover:-translate-y-0.5
        active:scale-[0.98]
      "
    >
      <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-text">{label}</div>
        <div className="text-[11px] text-text-dim">{hint}</div>
      </div>
    </button>
  )
}
