import { useState } from 'react'
import type { InvitedFriend } from '../api/types'
import type { SubStatus } from '../App'
import { ActivationBanner } from '../components/ActivationBanner'
import { GuidesSection } from '../components/GuidesSection'
import { HeroFox } from '../components/HeroFox'
import { InstallPrompt } from '../components/InstallPrompt'
import { PlansSection } from '../components/PlansSection'
import { RoutingConfigsSection } from '../components/RoutingConfigsSection'
import { StatusCard } from '../components/StatusCard'
import { DevicesBlock } from '../components/DevicesBlock'

interface DisplayPlan {
  id: number
  period: string
  price: number
  /** Каталожная цена до стартового предложения (например 399), если показываем скидку */
  listPriceRub?: number | null
  badge: string | null
  perMonth: string | null
  savingsHint?: string | null
  popular: boolean
  dataLimitGb: number | null
  maxDevices: number | null
}

interface HomeScreenProps {
  status: SubStatus
  isTrial: boolean
  daysLeft: number
  hoursLeft: number
  totalDays: number
  expiresAt: string
  hasTrialAvailable: boolean | undefined
  isTrialSubscription: boolean | undefined
  activationResult: unknown
  accessCodeLoading: boolean
  accessCodeError: string | null
  bannerDismissed: boolean
  displayPlans: DisplayPlan[]
  onDismissBanner: () => void
  onActivateAccessCode: (code: string) => Promise<boolean>
  onAccessCodeInputChange: () => void
  onTrial: () => Promise<void>
  onGetConfig: () => Promise<void>
  onSelectPlan: (planId: number) => void
  onShare: () => void
  onViewFriends: () => void
  onOpenRoutingLink: (deeplink: string) => void
  onSuggestConfig: () => void
  onGameOpen: () => void
  onOpenDevices: () => void
  isSoloPlan: boolean
  deviceCount: number
  dataLimitGb?: number | null
  dataUsedGb?: number | null
  showGameButton: boolean
  haptic: (type?: 'light' | 'medium' | 'heavy') => void
  referralCode: string
  referralLink: string | null
  friendsCount: number
  invitedPaidCount: number
  bonusDays: number
  bonusDaysPerReferral: number
  invitedFriends: InvitedFriend[]
  /** Скрыть блок Solo (активен платный безлимит). */
  hideSoloPlans?: boolean
}

export function HomeScreen({
  status,
  isTrial,
  daysLeft,
  hoursLeft,
  totalDays,
  expiresAt,
  hasTrialAvailable,
  isTrialSubscription,
  activationResult,
  accessCodeLoading,
  accessCodeError,
  bannerDismissed,
  displayPlans,
  onDismissBanner,
  onActivateAccessCode,
  onAccessCodeInputChange,
  onTrial,
  onGetConfig,
  onSelectPlan,
  onOpenRoutingLink,
  onSuggestConfig,
  onOpenDevices,
  isSoloPlan,
  deviceCount,
  dataLimitGb,
  dataUsedGb,
  haptic,
  hideSoloPlans = false,
}: HomeScreenProps) {
  const [accessCode, setAccessCode] = useState('')

  function heroVariant(): 'active' | 'welcome' | 'waiting' {
    if (status === 'active') return isTrialSubscription ? 'welcome' : 'active'
    if (status === 'expired') return 'waiting'
    return hasTrialAvailable ? 'welcome' : 'waiting'
  }

  return (
    <main className="px-5 pb-4">
      <HeroFox variant={heroVariant()} />

      {(activationResult && !bannerDismissed) as boolean && (
        <ActivationBanner
          result={activationResult as Parameters<typeof ActivationBanner>[0]['result']}
          onDismiss={onDismissBanner}
          hasTrialAvailable={hasTrialAvailable}
          onTrial={async () => {
            haptic('medium')
            await onTrial()
          }}
        />
      )}

      {status === 'none' && (
        <div className="mb-4 rounded-[4px] border border-border-card bg-bg-card p-4">
          <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
            <span className="w-3 h-px bg-accent" />
            Код доступа
          </div>
          <p className="text-xs text-text-muted mb-3">
            Введите код из поддержки, чтобы открыть доступ.
          </p>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              const value = accessCode.trim()
              if (!value || accessCodeLoading) return
              const activated = await onActivateAccessCode(value)
              if (activated) setAccessCode('')
            }}
          >
            <input
              type="text"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value)
                onAccessCodeInputChange()
              }}
              placeholder="Введите код"
              className="flex-1 w-1 px-3 py-2.5 rounded-[4px] text-sm text-text bg-bg border border-border-card outline-none placeholder-text-dim focus:border-accent-border"
            />
            <button
              type="submit"
              disabled={accessCodeLoading || !accessCode.trim()}
              className="px-4 py-2.5 rounded-[4px] text-xs font-bold text-white bg-accent cursor-pointer active:opacity-80 transition-opacity disabled:opacity-40"
            >
              {accessCodeLoading ? '...' : 'Активировать'}
            </button>
          </form>
          {accessCodeError && (
            <p className="text-[11px] text-red-400 mt-2">{accessCodeError}</p>
          )}
        </div>
      )}

      <StatusCard
        status={status}
        isTrial={isTrial}
        daysLeft={daysLeft}
        hoursLeft={hoursLeft}
        totalDays={totalDays}
        expiresAt={expiresAt}
        onGetConfig={onGetConfig}
        onRenew={() => {
          document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })
        }}
        dataLimitGb={dataLimitGb}
        dataUsedGb={dataUsedGb}
      />

      <div className="my-6 h-px bg-border" />

      <GuidesSection />

      <div className="my-6 h-px bg-border" />

      {/*  {showGameButton ? (
        <button
          type="button"
          onClick={() => { haptic('light'); onGameOpen() }}
          className="w-full py-4 bg-bg-card border border-accent-border rounded-sm flex items-center justify-center gap-3 cursor-pointer active:opacity-80"
        >
          <span className="text-lg">🦊</span>
          <span className="text-sm font-bold text-accent tracking-wide">Annet Runner</span>
          <span className="text-[10px] text-text-dim uppercase tracking-widest">Играть</span>
        </button>
      ) : (
        <GameComingSoon variant="home" />
      )} */}

      {/* <div className="my-6 h-px bg-border" /> */}

      <PlansSection
        plans={displayPlans}
        onSelect={onSelectPlan}
        hideSoloPlans={hideSoloPlans}
      />

      {!isSoloPlan ? (
        <>
          <div className="my-6 h-px bg-border" />
          <DevicesBlock
            deviceCount={deviceCount}
            onOpen={() => { haptic('light'); onOpenDevices() }}
          />
          <div className="my-6 h-px bg-border" />
        </>
      ) : (
        <div className="my-6 h-px bg-border" />
      )}

      <RoutingConfigsSection
        onOpenInApp={(deeplink) => {
          haptic('light')
          onOpenRoutingLink(deeplink)
        }}
        onSuggest={() => {
          haptic('light')
          onSuggestConfig()
        }}
      />

      <div className="my-6 h-px bg-border" />

      <InstallPrompt />


    </main>
  )
}
