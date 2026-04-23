import { useState } from 'react'
import type { SupportContext } from '../api/types'

interface SupportPaymentSheetProps {
  open: boolean
  onClose: () => void
  onPay: (provider: 'yookassa' | 'cryptobot', amount: number) => void
  supportContext: SupportContext | null
}

const MIN_AMOUNT = 99
/** Быстрый выбор суммы (руб.) */
const PRESET_AMOUNTS = [99, 199, 299, 499, 999] as const

export function SupportPaymentSheet({ open, onClose, onPay, supportContext }: SupportPaymentSheetProps) {
  const [amount, setAmount] = useState(MIN_AMOUNT)

  if (!open) return null

  const bonusLabel = supportContext?.bonus_label ?? '+14 дней VPN в подарок'
  const validAmount = amount >= MIN_AMOUNT

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    setAmount(digits ? parseInt(digits, 10) : 0)
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease' }}
        onClick={onClose}
      />

      <div
        className="absolute bottom-0 left-0 right-0 bg-[#0f1923] rounded-t-2xl"
        style={{ animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="pt-3 pb-2 px-5">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-[#4a7fcc]">
              <span className="w-3 h-px bg-[#4a7fcc]" />
              Поддержка MTProto
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#6b85a8] text-sm cursor-pointer hover:border-[#4a7fcc] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 pb-10">
          <div
            className="rounded-xl p-4 mb-4 text-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-[11px] text-[#6b85a8] font-semibold mb-2">
              Поддержка работы прокси
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {PRESET_AMOUNTS.map((preset) => {
                const selected = amount === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={[
                      'min-w-17 px-2.5 py-2 rounded-[4px] text-xs font-extrabold tracking-tight transition-[border-color,background-color,transform] duration-150',
                      'active:scale-[0.97]',
                      selected
                        ? 'text-white border border-[#4a7fcc] bg-[rgba(74,127,204,0.18)] shadow-[0_0_0_1px_rgba(74,127,204,0.25)]'
                        : 'text-[#c8d4e4] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(74,127,204,0.35)] hover:bg-[rgba(74,127,204,0.08)]',
                    ].join(' ')}
                  >
                    {preset} ₽
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={amount || ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="99"
                className="w-20 text-center text-2xl font-extrabold text-white tracking-tight bg-transparent border-b-2 border-[rgba(74,127,204,0.4)] outline-none focus:border-[#4a7fcc] transition-colors"
              />
              <span className="text-sm font-bold text-white opacity-70">руб</span>
            </div>
            <div className="text-[10px] text-[#6b85a8] mt-1.5">
              от {MIN_AMOUNT} руб
            </div>
            <div className="text-[11px] text-[#4a7fcc] mt-1.5 font-medium">
              {bonusLabel}
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <PaymentOption
              icon="💳"
              label="Банковская карта"
              hint="Visa, MasterCard, МИР"
              disabled={!validAmount}
              onClick={() => onPay('yookassa', amount)}
            />
            <PaymentOption
              icon="₿"
              label="Криптовалюта"
              hint="USDT, TON, BTC"
              disabled={!validAmount}
              onClick={() => onPay('cryptobot', amount)}
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg text-sm font-semibold text-[#6b85a8] cursor-pointer active:opacity-70 transition-opacity"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentOption({ icon, label, hint, onClick, disabled }: {
  icon: string
  label: string
  hint: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        w-full flex items-center gap-3 rounded-xl p-3.5 cursor-pointer text-left
        transition-[border-color,transform,opacity] duration-200
        hover:border-[rgba(74,127,204,0.4)] hover:-translate-y-0.5
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
      "
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ background: 'rgba(74,127,204,0.12)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] text-[#6b85a8]">{hint}</div>
      </div>
    </button>
  )
}
