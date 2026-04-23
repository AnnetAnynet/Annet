import { useCallback, useEffect, useState } from 'react'
import {
  activateMiniAppCode,
  activateTrial,
  createPayment,
  createUpgradePayment,
  fetchDashboard,
  fetchPlans,
  fetchVpnConfig,
} from '../api/endpoints'
import { ApiError } from '../api/client'
import type { ActivateResult, DashboardData, Plan, VpnConfig } from '../api/types'
export interface AppError {
  message: string
  /** HTTP status code if available */
  status?: number
  /** Raw detail from backend */
  detail?: string
}

export function useAppData(telegramId: number | null) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [vpnConfig, setVpnConfig] = useState<VpnConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [activationResult, setActivationResult] = useState<ActivateResult | null>(null)

  const loadData = useCallback(async () => {
    if (!telegramId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const [dash, planList] = await Promise.all([
        fetchDashboard(telegramId),
        fetchPlans(),
      ])
      setDashboard(dash)
      setPlans(planList.filter(p => p.is_active))
    } catch (err) {
      console.error('Failed to load app data:', err)
      if (err instanceof ApiError) {
        setError({ message: `HTTP ${err.status}`, status: err.status, detail: err.detail })
      } else if (err instanceof TypeError) {
        // Network/CORS error - fetch itself throws TypeError
        setError({ message: 'Сеть недоступна (CORS или timeout)', detail: String(err) })
      } else {
        setError({ message: 'Неизвестная ошибка', detail: String(err) })
      }
    } finally {
      setLoading(false)
    }
  }, [telegramId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const loadConfig = useCallback(async () => {
    if (!telegramId) return null
    try {
      const config = await fetchVpnConfig(telegramId)
      setVpnConfig(config)
      return config
    } catch (err) {
      console.error('Failed to load VPN config:', err)
      return null
    }
  }, [telegramId])

  const pay = useCallback(
    async (planId: number, provider: 'yookassa' | 'cryptobot', username?: string | null, promoCode?: string | null) => {
      if (!telegramId) return null
      return createPayment(telegramId, planId, provider, username, promoCode)
    },
    [telegramId],
  )

  const payUpgrade = useCallback(
    async (planId: number, provider: 'yookassa' | 'cryptobot', username?: string | null) => {
      if (!telegramId) return null
      return createUpgradePayment(telegramId, planId, provider, username)
    },
    [telegramId],
  )

  const activateCode = useCallback(async (startParam: string, username?: string | null) => {
    if (!telegramId) return null
    const result = await activateMiniAppCode(telegramId, startParam, username)
    setActivationResult(result)
    // Reload dashboard so status reflects the new access grant
    await loadData()
    return result
  }, [telegramId, loadData])

  const trial = useCallback(async () => {
    if (!telegramId) return false
    try {
      await activateTrial(telegramId)
      await loadData()
      return true
    } catch (err) {
      console.error('Failed to activate trial:', err)
      return false
    }
  }, [telegramId, loadData])

  return {
    dashboard,
    plans,
    vpnConfig,
    loading,
    error,
    activationResult,
    refresh: loadData,
    loadConfig,
    pay,
    payUpgrade,
    activateCode,
    trial,
  }
}

export type { AppError as UseAppDataError }
