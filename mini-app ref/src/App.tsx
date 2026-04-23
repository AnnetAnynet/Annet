import { useCallback, useEffect, useRef, useState } from 'react'
import { GameScreen } from './game/GameScreen'
import { GameLeaderboard } from './game/components/GameLeaderboard'
import { GameTabSummary } from './game/components/GameTabSummary'
import { Header } from './components/Header'
import { HeroFox } from './components/HeroFox'
import { ConfigSheet } from './components/ConfigSheet'
import { PaymentSheet } from './components/PaymentSheet'
import { SupportPaymentSheet } from './components/SupportPaymentSheet'
import { SuggestConfigSheet } from './components/SuggestConfigSheet'
import { GameComingSoon } from './components/GameComingSoon'
import { BottomNav } from './components/BottomNav'
import type { TabId } from './components/BottomNav'
import { HomeScreen } from './screens/HomeScreen'
import { MtProtoScreen } from './screens/MtProtoScreen'
import { DevicesScreen } from './screens/DevicesScreen'
import { ReferralScreen } from './screens/ReferralScreen'
import { ReportsScreen } from './screens/ReportsScreen'
import { useTelegram } from './hooks/useTelegram'
import { useAppData } from './hooks/useAppData'
import { API_BASE_LABEL } from './api/apiBase'
import { ApiError } from './api/client'
import {
  createSupportPayment,
  fetchDashboard,
  fetchDevices,
  fetchSupportContext,
  fetchUpgradePreview,
  getSupportPaymentStatus,
} from './api/endpoints'
import type { Plan, SoloUnlimitedUpgradePreview, SupportContext, SupportPaymentStatus } from './api/types'
import { formatApiErrorMessage } from './utils/apiError'
import { resolveInviteLink, supportInviteRequestTelegramUrl, supportTelegramUrl } from './utils/inviteLink'
import { showTelegramAlert } from './utils/telegramAlert'

export type SubStatus = 'active' | 'expired' | 'none'

/** Локальный fallback, если API недоступен; совпадает с ценами из миграций 011/013. */
const FALLBACK_PLANS: Plan[] = [
  { id: 5, name: 'Solo 1 месяц', duration_days: 30, price_rub: 179, is_active: true, sort_order: 5, data_limit_gb: 20, max_devices: 0 },
  { id: 1, name: '1 месяц', duration_days: 30, price_rub: 399, is_active: true, sort_order: 10, data_limit_gb: null, max_devices: null },
  { id: 2, name: '3 месяца', duration_days: 90, price_rub: 1099, is_active: true, sort_order: 15, data_limit_gb: null, max_devices: null },
  { id: 3, name: '6 месяцев', duration_days: 180, price_rub: 1799, is_active: true, sort_order: 20, data_limit_gb: null, max_devices: null },
  { id: 4, name: '12 месяцев', duration_days: 365, price_rub: 3199, is_active: true, sort_order: 30, data_limit_gb: null, max_devices: null },
]

/** Плашка «Популярно» в сетке тарифов - план с этим `id` в API (у нас 3 месяца). */
const POPULAR_PLAN_ID = 2

const START_PLAN_DAYS = 30

function planTierKey(dataLimitGb: number | null): string {
  return dataLimitGb != null ? 'solo' : 'unlimited'
}

function derivePlanDisplay(
  plans: Plan[],
  opts: { startOffer: boolean; startPriceRub: number | null },
) {
  const sorted = [...plans].sort((a, b) => a.sort_order - b.sort_order)
  const useStartPrice =
    opts.startOffer && opts.startPriceRub != null && opts.startPriceRub > 0

  type Built = {
    id: number
    name: string
    durationDays: number
    priceRub: number
    listPriceRub: number | null
    billingMonths: number
    perMonthRub: number | null
    popular: boolean
    dataLimitGb: number | null
    maxDevices: number | null
  }

  const built: Built[] = sorted.map(p => {
    // Стартовая цена 299 ₽ применяется только к безлимитному месяцу (Solo остаётся по каталожной цене).
    const startPriceApplies =
      useStartPrice && p.duration_days === START_PLAN_DAYS && p.data_limit_gb == null
    const priceRub = startPriceApplies ? opts.startPriceRub! : p.price_rub

    // «Руб/мес» как доля периода по календарным месяцам: duration÷30 → для 365 дн. это 12,
    // а не ×30/365 (там занижение из‑за 365 vs 12×30).
    const billingMonths =
      p.duration_days > 30
        ? Math.max(1, Math.round(p.duration_days / 30))
        : 0
    const perMonthRub =
      billingMonths > 0 ? Math.round(priceRub / billingMonths) : null

    const popular = p.id === POPULAR_PLAN_ID

    const listPriceRub =
      startPriceApplies && p.price_rub !== priceRub ? p.price_rub : null

    return {
      id: p.id,
      name: p.name,
      durationDays: p.duration_days,
      priceRub,
      listPriceRub,
      billingMonths,
      perMonthRub,
      popular,
      dataLimitGb: p.data_limit_gb ?? null,
      maxDevices: p.max_devices ?? null,
    }
  })

  // Сравнение выгоды с помесячной оплатой по каталогу, не по стартовой цене первого месяца.
  const baselineMonthlyByTier = new Map<string, number>()
  for (const p of sorted) {
    if (p.duration_days !== START_PLAN_DAYS) continue
    baselineMonthlyByTier.set(planTierKey(p.data_limit_gb ?? null), p.price_rub)
  }

  return built.map(b => {
    const perMonth =
      b.perMonthRub !== null
        ? `≈ ${b.perMonthRub.toLocaleString('ru-RU')} руб/мес`
        : null

    let savingsHint: string | null = null
    if (b.durationDays > 30 && b.billingMonths > 0) {
      const baseline = baselineMonthlyByTier.get(planTierKey(b.dataLimitGb))
      if (baseline != null && baseline > 0) {
        const atMonthlyPace = baseline * b.billingMonths
        const savingsRub = Math.round(atMonthlyPace - b.priceRub)
        if (savingsRub >= 1) {
          const rub = savingsRub.toLocaleString('ru-RU')
          const pct = Math.round((savingsRub / atMonthlyPace) * 100)
          savingsHint =
            pct > 0
              ? `Выгода ~${rub} ₽`
              : `Выгода ~${rub} ₽`
        }
      }
    }

    return {
      id: b.id,
      period: b.name,
      price: b.priceRub,
      listPriceRub: b.listPriceRub,
      badge: b.popular ? 'Популярно' : null,
      perMonth,
      savingsHint,
      popular: b.popular,
      dataLimitGb: b.dataLimitGb,
      maxDevices: b.maxDevices,
    }
  })
}

export default function App() {
  const {
    user,
    loading: authLoading,
    haptic,
    openLink,
    openTelegramUrl,
    openMtProtoProxyLink,
    shareTelegramUrl,
    startParam,
  } = useTelegram()
  const {
    dashboard,
    plans: rawPlans,
    vpnConfig,
    loading: dataLoading,
    error: dataError,
    activationResult,
    refresh,
    loadConfig,
    pay,
    payUpgrade,
    activateCode,
    trial,
  } = useAppData(user?.telegramId ?? null)

  const isMiniAppAdmin = Boolean(user?.isAdmin || dashboard?.is_admin)

  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [configOpen, setConfigOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentSheetError, setPaymentSheetError] = useState<string | null>(null)
  const [paymentSheetInviteSupport, setPaymentSheetInviteSupport] = useState(false)
  const [suggestConfigOpen, setSuggestConfigOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [paymentUsesUpgrade, setPaymentUsesUpgrade] = useState(false)
  const [soloUpgradeQuote, setSoloUpgradeQuote] = useState<SoloUnlimitedUpgradePreview | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [devicesOpen, setDevicesOpen] = useState(false)
  const [deviceCount, setDeviceCount] = useState(0)
  const [supportPaymentOpen, setSupportPaymentOpen] = useState(false)
  const [supportContext, setSupportContext] = useState<SupportContext | null>(null)
  const [supportPaymentStatus, setSupportPaymentStatus] = useState<SupportPaymentStatus | null>(null)
  const [pendingSupportPaymentId, setPendingSupportPaymentId] = useState<number | null>(() => {
    const raw = localStorage.getItem('pending_support_payment_id')
    return raw ? parseInt(raw, 10) || null : null
  })
  const [pendingDeviceConfigDeviceId, setPendingDeviceConfigDeviceId] = useState<number | null>(() => {
    const raw = localStorage.getItem('pending_device_config_device_id')
    return raw ? parseInt(raw, 10) || null : null
  })
  const [gameOpen, setGameOpen] = useState(false)
  /** Bumped when the fullscreen game closes so Game tab stats refetch (leaderboard + summary cache only on mount otherwise). */
  const [gameStatsTick, setGameStatsTick] = useState(0)
  const [accessCodeLoading, setAccessCodeLoading] = useState(false)
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null)
  const [gameNickname, setGameNickname] = useState<string | null>(() => {
    const tid = user?.telegramId
    if (!tid) return null
    return localStorage.getItem(`game_nickname_${tid}`) || null
  })

  useEffect(() => {
    if (!user?.telegramId) return
    const stored = localStorage.getItem(`game_nickname_${user.telegramId}`)
    if (stored) setGameNickname(stored)
  }, [user?.telegramId])

  const bumpGameTabStats = useCallback(() => {
    setGameStatsTick((t) => t + 1)
  }, [])

  const handleGameScreenClose = useCallback(() => {
    bumpGameTabStats()
    setGameOpen(false)
  }, [bumpGameTabStats])

  const refreshDeviceCount = useCallback(async () => {
    if (!user?.telegramId) return
    try {
      const data = await fetchDevices(user.telegramId)
      setDeviceCount(data.devices.length)
    } catch { /* */ }
  }, [user?.telegramId])

  useEffect(() => {
    if (user?.telegramId && !dataLoading) refreshDeviceCount()
  }, [user?.telegramId, dataLoading, refreshDeviceCount])

  // Activate start code / referral once after auth + data are ready
  const activationAttempted = useRef(false)
  useEffect(() => {
    if (activationAttempted.current) return
    if (!user || dataLoading) return
    if (!startParam) return
    activationAttempted.current = true
    if (startParam === 'mtproto') {
      setActiveTab('mtproto')
      return
    }
    // https://t.me/<bot>/app?startapp=game → initDataUnsafe.start_param === 'game'
    if (startParam === 'game') {
      setActiveTab('game')
      setGameOpen(true)
      return
    }
    activateCode(startParam, user.username).catch((err) => {
      console.error('Failed to activate start parameter:', err)
    })
  }, [user, dataLoading, startParam, activateCode])

  // Load support context when MTProto tab opens
  useEffect(() => {
    if (activeTab !== 'mtproto' || !user?.telegramId) return
    fetchSupportContext(user.telegramId, user.username)
      .then(setSupportContext)
      .catch(() => {})
  }, [activeTab, user?.telegramId, user?.username])

  const plans = rawPlans.length > 0 ? rawPlans : FALLBACK_PLANS
  const displayPlans = derivePlanDisplay(plans, {
    startOffer: Boolean(dashboard?.start_offer_available),
    startPriceRub: dashboard?.start_price_rub ?? null,
  })

  const invitedFriends = dashboard?.invited_friends ?? []
  const bonusDaysPerReferral = dashboard?.bonus_days_per_referral ?? 10
  const referralInviteeBonusDays = dashboard?.referral_invitee_bonus_days ?? 0
  const invitedPaidCount =
    dashboard?.invited_paid_count ?? invitedFriends.filter(f => f.bonus_applied).length

  const status: SubStatus = dashboard?.has_subscription
    ? (dashboard.status === 'active' ? 'active' : 'expired')
    : 'none'
  const isSoloPlan = (dashboard?.has_subscription ?? false) && (dashboard?.data_limit_gb ?? null) !== null
  const hideSoloPlans =
    status === 'active' && !(dashboard?.is_trial ?? false) && (dashboard?.data_limit_gb ?? null) === null

  const handleGetConfig = async () => {
    haptic('medium')
    await loadConfig()
    setConfigOpen(true)
  }

  const handleSelectPlan = (planId: number) => {
    void (async () => {
      haptic('light')
      setPaymentSheetError(null)
      setPaymentSheetInviteSupport(false)
      setAccessCodeError(null)
      setPaymentUsesUpgrade(false)
      setSoloUpgradeQuote(null)

      const picked = displayPlans.find(p => p.id === planId)
      const unlimitedTarget = Boolean(picked && picked.dataLimitGb == null)
      const useUpgrade = Boolean(isSoloPlan && unlimitedTarget && user?.telegramId)

      if (useUpgrade && user?.telegramId) {
        try {
          const quote = await fetchUpgradePreview(user.telegramId, planId)
          setSoloUpgradeQuote(quote)
          setPaymentUsesUpgrade(true)
        } catch {
          showTelegramAlert('Не удалось рассчитать апгрейд. Попробуйте позже.')
          return
        }
      }

      setSelectedPlanId(planId)
      setPaymentOpen(true)
    })()
  }

  const handleActivateAccessCode = useCallback(async (code: string) => {
    if (!user?.telegramId) return false
    const raw = code.trim()
    if (!raw) return false

    setAccessCodeLoading(true)
    setAccessCodeError(null)
    setBannerDismissed(false)
    haptic('medium')

    try {
      const startCodeParam = raw.startsWith('code_') ? raw : `code_${raw}`
      const result = await activateCode(startCodeParam, user.username)
      return Boolean(result)
    } catch (err) {
      setAccessCodeError(
        formatApiErrorMessage(err, 'Не удалось активировать код. Проверьте его и попробуйте снова.'),
      )
      return false
    } finally {
      setAccessCodeLoading(false)
    }
  }, [activateCode, haptic, user?.telegramId, user?.username])

  const handlePay = async (provider: 'yookassa' | 'cryptobot', promoCode?: string | null) => {
    if (!selectedPlanId) return
    haptic('medium')
    setPaymentSheetError(null)
    setPaymentSheetInviteSupport(false)
    try {
      const result =
        paymentUsesUpgrade && soloUpgradeQuote
          ? await payUpgrade(selectedPlanId, provider, user?.username)
          : await pay(selectedPlanId, provider, user?.username, promoCode)
      if (result?.payment_url) {
        openLink(result.payment_url)
        setPaymentOpen(false)
        setPaymentSheetError(null)
        setPaymentSheetInviteSupport(false)
        return
      }
      if (!user?.telegramId) {
        setPaymentSheetError(
          'Не удалось определить аккаунт Telegram. Откройте приложение из Telegram.',
        )
      }
    } catch (err) {
      const isNoAccess =
        err instanceof ApiError &&
        (err.status === 403 || err.detail.includes('Purchase access'))
      if (isNoAccess) {
        setPaymentSheetInviteSupport(true)
        setPaymentSheetError(
          'Оплата доступна после приглашения. Сейчас у вас нет доступа к покупке. Запросите код приглашения в поддержке.',
        )
        return
      }
      const isConflict =
        err instanceof ApiError &&
        (err.status === 409 || err.detail.includes('жёстким лимитом'))
      if (isConflict) {
        setPaymentSheetInviteSupport(false)
        setPaymentSheetError(
          formatApiErrorMessage(
            err,
            'Этот тариф сейчас недоступен: нельзя перейти на более жёсткий лимит при активной подписке.',
          ),
        )
        return
      }
      setPaymentSheetInviteSupport(false)
      setPaymentSheetError(
        formatApiErrorMessage(err, 'Не удалось создать платёж. Попробуйте ещё раз.'),
      )
    }
  }

  const handleSupportPay = async (provider: 'yookassa' | 'cryptobot', amount: number) => {
    if (!user?.telegramId) return
    haptic('medium')
    try {
      const result = await createSupportPayment(user.telegramId, provider, amount, user.username)
      if (result?.payment_url) {
        localStorage.setItem('pending_support_payment_id', String(result.id))
        setPendingSupportPaymentId(result.id)
        openLink(result.payment_url)
        setSupportPaymentOpen(false)
      }
    } catch (err) {
      showTelegramAlert(
        formatApiErrorMessage(err, 'Не удалось создать платёж. Попробуйте ещё раз.'),
      )
    }
  }

  useEffect(() => {
    if (!pendingSupportPaymentId) return

    let cancelled = false
    const clear = () => {
      setPendingSupportPaymentId(null)
      localStorage.removeItem('pending_support_payment_id')
    }
    const check = async () => {
      try {
        const status = await getSupportPaymentStatus(pendingSupportPaymentId)
        if (cancelled) return
        if (status.status === 'paid') {
          setSupportPaymentStatus(status)
          setActiveTab('mtproto')
          clear()
        } else if (status.status === 'failed') {
          clear()
        }
      } catch {
        if (!cancelled) clear()
      }
    }

    check()
    const interval = setInterval(check, 4000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      clear()
    }, 120_000)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [pendingSupportPaymentId])

  const clearPendingDeviceConfig = useCallback(() => {
    setPendingDeviceConfigDeviceId(null)
    localStorage.removeItem('pending_device_config_device_id')
  }, [])

  const handleDevicePaymentInitiated = useCallback((deviceId: number | null) => {
    if (deviceId === null) {
      clearPendingDeviceConfig()
      return
    }
    setPendingDeviceConfigDeviceId(deviceId)
    localStorage.setItem('pending_device_config_device_id', String(deviceId))
  }, [clearPendingDeviceConfig])

  useEffect(() => {
    if (!pendingDeviceConfigDeviceId || !user?.telegramId) return

    let cancelled = false
    const check = async () => {
      try {
        const dash = await fetchDashboard(user.telegramId)
        if (cancelled) return
        const isActive = dash.has_subscription && dash.status === 'active'
        if (!isActive) return

        clearPendingDeviceConfig()
        await refresh()
        await refreshDeviceCount()
        if (!cancelled) setDevicesOpen(true)
      } catch {
        /* keep polling */
      }
    }

    check()
    const interval = setInterval(check, 4000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!cancelled) clearPendingDeviceConfig()
    }, 120_000)

    return () => {
      cancelled = true
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [clearPendingDeviceConfig, pendingDeviceConfigDeviceId, refresh, refreshDeviceCount, user?.telegramId])

  const supportUrl = supportTelegramUrl()
  /** Открыть чат поддержки; при `withInviteDraft` - ссылка с черновиком запроса кода приглашения. */
  const handleSupport = useCallback(
    (withInviteDraft = false) => {
      const url = withInviteDraft
        ? (supportInviteRequestTelegramUrl() ?? supportTelegramUrl())
        : supportTelegramUrl()
      if (!url) return
      haptic('light')
      openTelegramUrl(url)
    },
    [haptic, openTelegramUrl],
  )

  const handleShare = () => {
    const link = resolveInviteLink(
      dashboard?.referral_code ?? '-',
      dashboard?.referral_link ?? null,
    )
    if (!link) return
    haptic('light')
    shareTelegramUrl(link, 'Пользуюсь Annet Cloud - небольшой сервис с защитой соединения. Вот моя ссылка для подключения.')
  }

  // After auth, `useAppData` briefly keeps `dataLoading === false` from the initial
  // `telegramId === null` run (effect has not called `setLoading(true)` yet), which
  // flashes the main UI for one frame. Keep the shell until we have dashboard or error.
  const isLoading =
    authLoading ||
    (user != null && dataLoading) ||
    (user != null && dashboard === null && !dataError)

  const showGameButton = true

  if (!isLoading && dataError) {
    const apiBase = API_BASE_LABEL
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 gap-4">
        <div className="w-full max-w-sm bg-bg-card border border-red rounded-[4px] p-5 space-y-3">
          <div className="text-sm font-bold text-red uppercase tracking-widest">Ошибка загрузки</div>
          <div className="text-xs text-text-muted font-mono break-all">{dataError.message}</div>
          {dataError.detail && (
            <div className="text-[10px] text-text-dim font-mono break-all opacity-70">{dataError.detail.slice(0, 300)}</div>
          )}
          <div className="text-[10px] text-text-dim font-mono">
            <div>API: {apiBase}</div>
            <div>tg_id: {user?.telegramId ?? 'null'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-5 py-2.5 bg-accent text-white text-xs font-bold rounded-[4px] cursor-pointer"
        >
          Повторить
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
        <HeroFox variant="loading" />
        <div className="flex flex-col items-center gap-3 -mt-1">
          <div
            className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent"
            style={{ animation: 'spin 0.8s linear infinite' }}
          />
          <span className="text-xs text-text-dim tracking-[0.08em] uppercase font-semibold">
            Загрузка
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header
        displayName={user?.firstName ?? user?.username}
        photoUrl={user?.photoUrl}
        onSupportClick={supportUrl ? () => handleSupport() : undefined}
      />

      {/* Tab screens - rendered in place, scrollable content */}
      <div className="pb-16">
        {activeTab === 'home' && (
          <HomeScreen
            status={status}
            isTrial={dashboard?.is_trial ?? false}
            daysLeft={dashboard?.days_left ?? 0}
            hoursLeft={dashboard?.hours_left ?? 0}
            totalDays={dashboard?.total_days ?? 0}
            expiresAt={dashboard?.expires_at ?? ''}
            hasTrialAvailable={dashboard?.has_trial_available}
            isTrialSubscription={dashboard?.is_trial}
            activationResult={activationResult}
            accessCodeLoading={accessCodeLoading}
            accessCodeError={accessCodeError}
            bannerDismissed={bannerDismissed}
            displayPlans={displayPlans}
            onDismissBanner={() => setBannerDismissed(true)}
            onActivateAccessCode={handleActivateAccessCode}
            onAccessCodeInputChange={() => setAccessCodeError(null)}
            onTrial={async () => {
              const ok = await trial()
              if (ok) setBannerDismissed(true)
            }}
            onGetConfig={handleGetConfig}
            onSelectPlan={handleSelectPlan}
            onShare={handleShare}
            onViewFriends={() => {}}
            onOpenRoutingLink={(deeplink) => openLink(deeplink)}
            onSuggestConfig={() => setSuggestConfigOpen(true)}
            onGameOpen={() => setGameOpen(true)}
            onOpenDevices={() => setDevicesOpen(true)}
            isSoloPlan={isSoloPlan}
            deviceCount={deviceCount}
            dataLimitGb={dashboard?.data_limit_gb}
            dataUsedGb={dashboard?.data_used_gb}
            showGameButton={showGameButton}
            haptic={haptic}
            referralCode={dashboard?.referral_code ?? '-'}
            referralLink={dashboard?.referral_link ?? null}
            friendsCount={dashboard?.friends_count ?? 0}
            invitedPaidCount={invitedPaidCount}
            bonusDays={dashboard?.bonus_days ?? 0}
            bonusDaysPerReferral={bonusDaysPerReferral}
            invitedFriends={invitedFriends}
            hideSoloPlans={hideSoloPlans}
          />
        )}

        {activeTab === 'mtproto' && (
          <MtProtoScreen
            onSupport={() => setSupportPaymentOpen(true)}
            haptic={haptic}
            openMtProtoProxyLink={openMtProtoProxyLink}
            supportContext={supportContext}
            supportPaymentStatus={supportPaymentStatus}
            onDismissPaymentStatus={() => {
              setSupportPaymentStatus(null)
              setPendingSupportPaymentId(null)
              localStorage.removeItem('pending_support_payment_id')
            }}
            onShare={(url, text) => shareTelegramUrl(url, text)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen telegramId={user?.telegramId ?? null} supportUrl={supportUrl} />
        )}

        {activeTab === 'referral' && (
          <ReferralScreen
            referralCode={dashboard?.referral_code ?? '-'}
            referralLink={dashboard?.referral_link ?? null}
            friendsCount={dashboard?.friends_count ?? 0}
            invitedPaidCount={invitedPaidCount}
            bonusDays={dashboard?.bonus_days ?? 0}
            bonusDaysPerReferral={bonusDaysPerReferral}
            referralInviteeBonusDays={referralInviteeBonusDays}
            invitedFriends={invitedFriends}
            onShare={handleShare}
          />
        )}

        {activeTab === 'game' && (
          showGameButton ? (
            <div className="flex flex-col  h-full items-center gap-5 px-5 pt-2 pb-4 min-h-screen bg-linear-to-b from-transparent to-bg">
              {/* Background gameplay video */}
              <video
                src="/assets/game/video/game-preview.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="fixed top-auto inset-0 w-full object-cover bottom-0 opacity-[0.56] z-10 pointer-events-none select-none "
              />
              {/* Top fade: bg → transparent */}
              <div
                className="fixed inset-0 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, #0d0d0d 0%, #0d0d0d 30%, transparent 70%)' }}
              />
              <div className="relative z-20 flex flex-col items-center gap-3 w-full">
                <img
                  src="/assets/game/annet-runner-logo.webp"
                  alt="Annet Runner"
                  className="w-40 h-40 object-contain drop-shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => { haptic('light'); setGameOpen(true) }}
                  className="w-full py-4 bg-accent border border-accent-border rounded-sm flex items-center justify-center gap-3 cursor-pointer active:opacity-80 animate-pulse"
                >
                  <span className="text-sm font-bold text-white tracking-wide">Начать игру</span>
                </button>
                <GameTabSummary telegramId={user?.telegramId} refreshKey={gameStatsTick} />
              </div>
              <div className="relative w-full z-20">
                <GameLeaderboard
                  telegramId={user?.telegramId}
                  nickname={gameNickname || user?.username || user?.firstName || null}
                  onNicknameChange={setGameNickname}
                  refreshKey={gameStatsTick}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 px-5 pb-4">
              <GameComingSoon variant="tab" />
              <GameLeaderboard />
            </div>
          )
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onChange={(tab) => { haptic('light'); setActiveTab(tab) }}
      />

      <ConfigSheet
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        subscriptionUrl={vpnConfig?.proxy_subscription_url || ''}
      />

      <PaymentSheet
        open={paymentOpen}
        onClose={() => {
          setAccessCodeError(null)
          setPaymentSheetError(null)
          setPaymentSheetInviteSupport(false)
          setPaymentUsesUpgrade(false)
          setSoloUpgradeQuote(null)
          setPaymentOpen(false)
        }}
        planId={selectedPlanId}
        plans={displayPlans}
        telegramId={user?.telegramId ?? null}
        soloUpgradeQuote={paymentUsesUpgrade ? soloUpgradeQuote : null}
        onPay={handlePay}
        payError={paymentSheetError}
        showSupportInviteButton={paymentSheetInviteSupport}
        onOpenSupportInvite={() => handleSupport(true)}
        onActivateAccessCode={handleActivateAccessCode}
        accessCodeLoading={accessCodeLoading}
        accessCodeError={accessCodeError}
        onAccessCodeErrorChange={() => setAccessCodeError(null)}
      />

      <SupportPaymentSheet
        open={supportPaymentOpen}
        onClose={() => setSupportPaymentOpen(false)}
        onPay={handleSupportPay}
        supportContext={supportContext}
      />

      <SuggestConfigSheet
        open={suggestConfigOpen}
        onClose={() => setSuggestConfigOpen(false)}
      />

      <DevicesScreen
        open={devicesOpen}
        onClose={() => { setDevicesOpen(false); refreshDeviceCount() }}
        telegramId={user?.telegramId ?? null}
        haptic={haptic}
        onShare={(url, text) => shareTelegramUrl(url, text)}
        displayPlans={displayPlans}
        onSelectPlan={handleSelectPlan}
        pendingDeviceConfigId={pendingDeviceConfigDeviceId}
        onDevicePaymentInitiated={handleDevicePaymentInitiated}
      />

      {gameOpen && showGameButton && (
        <GameScreen
          onClose={handleGameScreenClose}
          telegramId={user?.telegramId ?? null}
          defaultNickname={gameNickname || user?.username || user?.firstName || ''}
          isAdmin={isMiniAppAdmin}
        />
      )}
    </div>
  )
}
