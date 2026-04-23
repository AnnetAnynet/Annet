import { api } from './client'
import type { ActivatePromoCodeResult, ActivateResult, AuthResponse, CitySuggestion, DashboardData, Device, DeviceListResponse, GameProfile, IncidentReportRequest, IncidentReportResponse, LeaderboardEntry, LeaderboardPeriod, MtProtoProxyStats, MtProtoServerPublic, PaymentPreviewResult, PaymentResult, Plan, PlayerStats, ReportStatsResponse, RivalRosterResponse, SoloUnlimitedUpgradePreview, SubmitScoreResponse, SupportContext, SupportPaymentResult, SupportPaymentStatus, VpnConfig } from './types'

export async function authMiniApp(initData: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/mini-app/auth', {
    method: 'POST',
    body: { init_data: initData },
  })
}

export async function fetchDashboard(telegramId: number): Promise<DashboardData> {
  return api<DashboardData>('/api/mini-app/dashboard', {
    params: { telegram_id: telegramId },
  })
}

export async function fetchPlans(): Promise<Plan[]> {
  return api<Plan[]>('/api/subscription/plans')
}

export async function fetchVpnConfig(telegramId: number): Promise<VpnConfig> {
  return api<VpnConfig>('/api/vpn/config', {
    method: 'POST',
    body: { telegram_id: telegramId },
  })
}

export async function createPayment(
  telegramId: number,
  planId: number,
  provider: 'yookassa' | 'cryptobot',
  username?: string | null,
  promoCode?: string | null,
): Promise<PaymentResult> {
  return api<PaymentResult>('/api/payments/create', {
    method: 'POST',
    body: {
      telegram_id: telegramId,
      plan_id: planId,
      provider,
      username: username ?? null,
      promo_code: promoCode ?? null,
    },
  })
}

export async function fetchUpgradePreview(
  telegramId: number,
  unlimitedPlanId: number,
): Promise<SoloUnlimitedUpgradePreview> {
  return api<SoloUnlimitedUpgradePreview>('/api/payments/upgrade-preview', {
    params: { telegram_id: telegramId, plan_id: unlimitedPlanId },
  })
}

export async function createUpgradePayment(
  telegramId: number,
  unlimitedPlanId: number,
  provider: 'yookassa' | 'cryptobot',
  username?: string | null,
): Promise<PaymentResult> {
  return api<PaymentResult>('/api/payments/create-upgrade', {
    method: 'POST',
    body: {
      telegram_id: telegramId,
      plan_id: unlimitedPlanId,
      provider,
      username: username ?? null,
    },
  })
}

export async function previewPayment(
  planId: number,
  promoCode: string,
): Promise<PaymentPreviewResult> {
  return api<PaymentPreviewResult>('/api/payments/preview', {
    params: { plan_id: planId, promo_code: promoCode },
  })
}

export async function activateTrial(telegramId: number) {
  return api('/api/user/trial/activate', {
    method: 'POST',
    body: { telegram_id: telegramId },
  })
}

export async function fetchLeaderboard(
  excludeTelegramId?: number | null,
  period: LeaderboardPeriod = 'all',
): Promise<LeaderboardEntry[]> {
  const params: Record<string, string | number> = { period }
  if (excludeTelegramId) params.exclude_telegram_id = excludeTelegramId
  return api<LeaderboardEntry[]>('/api/game/leaderboard', { params })
}

/** Curated 3-6 rivals for a single run. Server decides roles and rotation. */
export async function fetchGameRivals(
  telegramId: number,
): Promise<RivalRosterResponse> {
  return api<RivalRosterResponse>('/api/game/rivals', {
    params: { telegram_id: telegramId },
  })
}

export async function submitGameScore(
  telegramId: number,
  nickname: string,
  distance: number,
  coinsCollected: number = 0,
): Promise<SubmitScoreResponse> {
  return api<SubmitScoreResponse>('/api/game/score', {
    method: 'POST',
    body: {
      telegram_id: telegramId,
      nickname,
      distance,
      coins_collected: coinsCollected,
    },
  })
}

export async function fetchGameProfile(telegramId: number): Promise<GameProfile> {
  return api<GameProfile>('/api/game/profile', {
    params: { telegram_id: telegramId },
  })
}

export async function patchGameActiveSkin(
  telegramId: number,
  skinKey: string | null,
): Promise<{ active_skin: string | null }> {
  return api<{ active_skin: string | null }>('/api/game/active-skin', {
    method: 'PATCH',
    body: { telegram_id: telegramId, skin_key: skinKey },
  })
}

export async function fetchMyStats(
  telegramId: number,
  period: LeaderboardPeriod = 'all',
): Promise<PlayerStats> {
  return api<PlayerStats>('/api/game/my-stats', {
    params: { telegram_id: telegramId, period },
  })
}

export async function updateNickname(
  telegramId: number,
  nickname: string,
): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>('/api/game/nickname', {
    method: 'PATCH',
    body: { telegram_id: telegramId, nickname },
  })
}

export async function activateMiniAppCode(
  telegramId: number,
  startParam: string,
  username?: string | null,
): Promise<ActivateResult> {
  return api<ActivateResult>('/api/mini-app/activate', {
    method: 'POST',
    body: { telegram_id: telegramId, start_param: startParam, username: username ?? null },
  })
}

export async function submitIncidentReport(data: IncidentReportRequest): Promise<IncidentReportResponse> {
  return api<IncidentReportResponse>('/api/reports', {
    method: 'POST',
    body: data,
  })
}

export async function fetchReportStats(): Promise<ReportStatsResponse> {
  return api<ReportStatsResponse>('/api/reports/stats')
}

export async function fetchCitySuggestions(q: string): Promise<CitySuggestion[]> {
  return api<CitySuggestion[]>('/api/reports/city-suggest', {
    params: { q },
  })
}

export async function fetchDevices(telegramId: number): Promise<DeviceListResponse> {
  return api<DeviceListResponse>('/api/mini-app/devices', {
    params: { telegram_id: telegramId },
  })
}

export async function addDevice(telegramId: number, name: string): Promise<Device> {
  return api<Device>('/api/mini-app/devices', {
    method: 'POST',
    body: { telegram_id: telegramId, name },
  })
}

export async function toggleDevice(
  telegramId: number,
  deviceId: number,
  enabled: boolean,
): Promise<Device> {
  return api<Device>(`/api/mini-app/devices/${deviceId}/toggle`, {
    method: 'PATCH',
    body: { telegram_id: telegramId, enabled },
  })
}

export async function renameDevice(
  telegramId: number,
  deviceId: number,
  name: string,
): Promise<Device> {
  return api<Device>(`/api/mini-app/devices/${deviceId}/rename`, {
    method: 'PATCH',
    body: { telegram_id: telegramId, name },
  })
}

export async function deleteDevice(telegramId: number, deviceId: number): Promise<void> {
  return api<void>(`/api/mini-app/devices/${deviceId}`, {
    method: 'DELETE',
    params: { telegram_id: telegramId },
  })
}

export async function fetchMtProtoServers(): Promise<MtProtoServerPublic[]> {
  return api<MtProtoServerPublic[]>('/api/mtproto/servers')
}

export async function fetchMtProtoProxyStats(): Promise<MtProtoProxyStats> {
  return api<MtProtoProxyStats>('/api/mtproto/proxy-stats')
}

export async function fetchSupportContext(
  telegramId: number,
  username?: string | null,
): Promise<SupportContext> {
  const params: Record<string, string | number> = { telegram_id: telegramId }
  if (username) params.username = username
  return api<SupportContext>('/api/support/context', { params })
}

export async function createSupportPayment(
  telegramId: number,
  provider: 'yookassa' | 'cryptobot',
  amountRub: number = 99,
  username?: string | null,
): Promise<SupportPaymentResult> {
  return api<SupportPaymentResult>('/api/support/create', {
    method: 'POST',
    body: {
      telegram_id: telegramId,
      provider,
      amount_rub: amountRub,
      username: username ?? null,
    },
  })
}

export async function getSupportPaymentStatus(paymentId: number): Promise<SupportPaymentStatus> {
  return api<SupportPaymentStatus>(`/api/support/${paymentId}`)
}

export async function activatePromoCode(
  telegramId: number,
  code: string,
): Promise<ActivatePromoCodeResult> {
  return api<ActivatePromoCodeResult>('/api/promo-codes/activate', {
    method: 'POST',
    body: { telegram_id: telegramId, code },
  })
}
