interface Plan {
  id: number
  period: string
  price: number
  listPriceRub?: number | null
  badge: string | null
  perMonth: string | null
  /** Сравнение с помесячной оплатой того же типа (Solo / безлимит), одна строка. */
  savingsHint?: string | null
  popular?: boolean
  dataLimitGb?: number | null
  maxDevices?: number | null
}

function formatRub(n: number) {
  return n.toLocaleString('ru-RU')
}

export function PlanPriceBlock({
  price,
  listPriceRub,
  align,
  size,
}: {
  price: number
  listPriceRub?: number | null
  align: 'center' | 'left'
  size: 'grid' | 'solo' | 'sheet'
}) {
  const showWas = listPriceRub != null && listPriceRub > price

  const priceClass =
    size === 'sheet'
      ? 'text-2xl font-extrabold tracking-tight'
      : size === 'solo'
        ? 'text-lg font-extrabold tracking-tight'
        : 'text-xl font-extrabold tracking-tight'

  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      {showWas && (
        <div
          className={[
            'text-text-dim line-through opacity-55',
            size === 'sheet' ? 'text-xs mb-1' : size === 'solo' ? 'text-[11px] mb-0.5' : 'text-xs mb-0.5',
          ].join(' ')}
        >
          {formatRub(listPriceRub)} руб
        </div>
      )}
      <div className={priceClass}>
        {formatRub(price)}{' '}
        <span className="text-[0.55em] font-bold opacity-70">руб</span>
      </div>
      {showWas && (
        <div className="text-[9px] text-text-dim mt-0.5">первый платный месяц</div>
      )}
    </div>
  )
}

interface PlansSectionProps {
  plans: Plan[]
  onSelect: (planId: number) => void
  /** Не показывать тарифы Solo (у пользователя активен безлимит). */
  hideSoloPlans?: boolean
}

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (id: number) => void }) {
  const isPopular = Boolean(plan.popular)

  return (
    <button
      key={plan.id}
      type="button"
      onClick={() => onSelect(plan.id)}
      className={[
        'relative text-center overflow-visible rounded-[3px] p-4 min-h-[124px] flex flex-col items-center justify-center',
        'transition-[transform,border-color,box-shadow] duration-200',
        'hover:-translate-y-1 active:scale-[0.97] cursor-pointer',
        isPopular
          ? [
              'border border-[rgba(213,96,0,0.55)]',
              'shadow-[0_0_0_1px_rgba(213,96,0,0.2),0_8px_28px_rgba(213,96,0,0.14)]',
              'hover:shadow-[0_12px_36px_rgba(0,0,0,0.45),0_0_32px_rgba(213,96,0,0.12)]',
            ].join(' ')
          : [
              'bg-[rgba(17,17,17,0.72)] border border-border-card',
              'hover:border-accent-border',
            ].join(' '),
      ].join(' ')}
      style={
        isPopular
          ? {
              background:
                'linear-gradient(165deg, rgba(213,96,0,0.2), rgba(17,17,17,0.88) 50%, rgba(17,17,17,0.92))',
            }
          : undefined
      }
    >
      {isPopular && (
        <div className="absolute inset-0 overflow-hidden rounded-[3px] pointer-events-none">
          <div
            className="absolute -inset-[40%]"
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(213,96,0,0.07) 60deg, transparent 120deg, rgba(213,96,0,0.05) 200deg, transparent 280deg)',
              animation: 'plan-aura 10s linear infinite',
            }}
          />
        </div>
      )}

      <div
        className={[
          'absolute left-0 top-0 bottom-0 w-[3px] z-10',
          isPopular ? 'opacity-100' : 'opacity-55',
        ].join(' ')}
        style={{
          background: 'linear-gradient(180deg, rgba(213,96,0,0.9), rgba(213,96,0,0.15))',
        }}
      />

      {plan.badge && (
        <div
          className={[
            'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-[9px] font-extrabold px-2.5 py-0.5 rounded-[2px] whitespace-nowrap tracking-[0.04em]',
            isPopular
              ? 'bg-accent text-white shadow-[0_4px_14px_rgba(213,96,0,0.45)]'
              : 'bg-bg-card border border-accent-border text-text shadow-[0_4px_14px_rgba(0,0,0,0.4)]',
          ].join(' ')}
        >
          {plan.badge}
        </div>
      )}

      <div className="relative z-10 w-full">
        <div className="text-[11px] text-text-muted font-semibold mb-1.5">{plan.period}</div>
        <PlanPriceBlock
          price={plan.price}
          listPriceRub={plan.listPriceRub}
          align="center"
          size="grid"
        />
        {plan.perMonth && (
          <div className="text-[10px] text-text-dim mt-1">{plan.perMonth}</div>
        )}
        {plan.savingsHint && (
          <p
            className="mt-1.5 w-full rounded-[3px] border border-accent-border/25 bg-accent-dim/35 px-1.5 py-1 text-center text-[9px] font-medium leading-snug text-text-muted text-balance"
          >
            {plan.savingsHint}
          </p>
        )}
      </div>
    </button>
  )
}

export function PlansSection({ plans, onSelect, hideSoloPlans = false }: PlansSectionProps) {
  const soloPlans = plans.filter(p => p.dataLimitGb != null)
  const unlimitedPlans = plans.filter(p => p.dataLimitGb == null)

  return (
    <section id="plans-section">
      <div className="flex items-center gap-1.5 mb-4 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
        <span className="w-3 h-px bg-accent" />
        Тарифы
      </div>

      {hideSoloPlans && soloPlans.length > 0 && (
        <p className="text-[11px] text-text-dim mb-3 leading-snug">
          Тариф Solo с лимитом трафика недоступен, пока у вас активен безлимит.
        </p>
      )}

      {/* Solo plans */}
      {!hideSoloPlans && soloPlans.length > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.06em]">Solo</span>
            <span className="text-[10px] text-text-dim">Для&nbsp;нечастого&nbsp;использования</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {soloPlans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelect(plan.id)}
                className={[
                  'relative text-left overflow-hidden rounded-[3px] p-4',
                  'bg-[rgba(17,17,17,0.72)] border border-border-card',
                  'transition-[transform,border-color,box-shadow] duration-200',
                  'hover:-translate-y-0.5 hover:border-accent-border active:scale-[0.98] cursor-pointer flex justify-between w-full',
                ].join(' ')}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] opacity-40"
                  style={{
                    background: 'linear-gradient(180deg, rgba(213,96,0,0.9), rgba(213,96,0,0.15))',
                  }}
                />

                

                <div className="relative z-10 flex items-center justify-between w-full">
                  <div>
                    <div className="text-[11px] text-text-muted font-semibold mb-1">{plan.period}</div>
                    <PlanPriceBlock
                      price={plan.price}
                      listPriceRub={plan.listPriceRub}
                      align="left"
                      size="solo"
                    />
                    {plan.perMonth && (
                      <div className="text-[10px] text-text-dim mt-1">{plan.perMonth}</div>
                    )}
                    {plan.savingsHint && (
                      <p className="mt-1.5 rounded-[3px] border border-accent-border/25 bg-accent-dim/35 px-1.5 py-1 text-[9px] font-medium leading-snug text-text-muted text-balance">
                        {plan.savingsHint}
                      </p>
                    )}
                  </div>
                   {/* Howling wolf silhouette */}
                <svg
                  className="right-3 pointer-events-none"
                  width="55" height="55" viewBox="0 0 32 32" fill="white"
                  style={{ opacity: 0.055 }}
                >
                  <path d="M15.948 1.378c-7.913 0-14.327 6.414-14.327 14.327 0 1.585 0.258 3.11 0.733 4.535 2.505-1.51 4.743-2.569 6.711-3.246-2.231 0.35-4.144 1.475-6.854 0.248 1.969-1.732 5.471-4.108 8.644-4.471 1.659-1.349 4.251-2.743 5.595-2.326 1.903-1.677 4.242-3.812 6.746-5.35l0 0c0.666 1.008 1.068 2.243 0.783 3.612-5.015 1.261-3.848 9.293 0.842 4.208 0.396 0.815 0.587 1.663 0.567 2.584-2.039 2.111-4.179 3.934-6.361 5.487 0.029 1.497-0.351 3.302-1.187 5.292-0.352 0.837-0.457 2.271 1.427 3.367 6.311-1.498 11.007-7.17 11.007-13.94-0-7.913-6.415-14.327-14.327-14.327z" />
                </svg>
                  <div className="flex gap-1.5">
                    {plan.dataLimitGb != null && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-text-dim bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[3px] px-2 py-1">
                        {plan.dataLimitGb}&nbsp;ГБ
                      </span>
                    )}
                    {plan.maxDevices != null && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-text-dim bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] rounded-[3px] px-2 py-1">
                        {plan.maxDevices}&nbsp;устр.
                      </span>
                    )}
                  </div>
                </div>

               
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unlimited plans */}
      {unlimitedPlans.length > 0 && (
        <div>
          {soloPlans.length > 0 && (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.06em]">Безлимит</span>
              <span className="text-[10px] text-text-dim">Без ограничений трафика</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 auto-rows-fr">
            {unlimitedPlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
