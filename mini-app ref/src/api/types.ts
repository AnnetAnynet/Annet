export interface AuthResponse {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  photo_url?: string | null
  /** Mini App admin (backend `mini_app_admin_telegram_ids`), e.g. game god mode */
  is_admin?: boolean
}

export interface InvitedFriend {
  username: string | null
  bonus_applied: boolean
}

export interface DashboardData {
  is_admin?: boolean
  has_subscription: boolean
  status: string | null
  is_trial: boolean
  days_left: number
  hours_left: number
  total_days: number
  expires_at: string | null
  expires_at_iso: string | null
  has_trial_available: boolean
  referral_code: string | null
  referral_link: string | null
  friends_count: number
  /** Сколько приглашённых с хотя бы одной оплатой (сервер); если нет в ответе - считаем по invited_friends */
  invited_paid_count?: number
  bonus_days: number
  bonus_days_per_referral?: number
  /** Дни приглашённому при первой оплате (0 вне акций) */
  referral_invitee_bonus_days?: number
  invited_friends?: InvitedFriend[]
  data_limit_gb?: number | null
  data_used_gb?: number | null
  /** Стартовая цена на первый платный месяц (30 дн.), если доступна по коду */
  start_offer_available?: boolean
  start_price_rub?: number | null
}

export interface Plan {
  id: number
  name: string
  duration_days: number
  price_rub: number
  is_active: boolean
  sort_order: number
  data_limit_gb: number | null
  max_devices: number | null
}

export interface VpnConfig {
  proxy_subscription_url: string | null
  links: string[]
  display_nodes: DisplayNode[]
}

export interface DisplayNode {
  node_id: number | null
  tag: string
  protocol: string
  ip_address: string | null
  country_code: string
  country_name: string
  flag_emoji: string
  display_name: string
}

export interface PaymentResult {
  id: number
  payment_url: string | null
  status: string
  provider: string
}

/** Solo → Unlimited upgrade quote (GET /api/payments/upgrade-preview). */
export interface SoloUnlimitedUpgradePreview {
  amount_rub: number
  credit_rub: number
  remaining_days_solo: number
  period_days_solo: number
  full_price_rub: number
  solo_price_rub: number
  unlimited_period_days: number
}

export interface ActivateResult {
  source: 'start_code' | 'referral' | null
  activated: boolean
  has_access: boolean
  start_code_remaining_slots: number | null
}

export type LeaderboardPeriod = 'all' | 'week' | 'day'

export interface LeaderboardEntry {
  nickname: string
  best_distance: number
  rank?: number
}

/** Where a rival comes from in the in-game race view. */
export type RivalSource = 'day' | 'week' | 'all'

/** Role of a curated rival (matches backend RivalRole enum). */
export type RivalRole =
  | 'pb'
  | 'stretch'
  | 'day_leader'
  | 'week_leader'
  | 'all_leader'
  | 'rotation'

export interface RivalRosterEntry {
  role: RivalRole
  nickname: string
  best_distance: number
  is_self: boolean
  rank_day?: number | null
  rank_week?: number | null
  rank_all?: number | null
}

export interface RivalRosterResponse {
  rivals: RivalRosterEntry[]
  player_best: number
}

export interface SubmitScoreResponse {
  best_distance: number
  is_new_record: boolean
  streak_days: number
  streak_continues: boolean
  total_coins: number
  newly_unlocked_skins: string[]
}

export interface GameProfile {
  nickname: string | null
  best_distance: number | null
  streak_days: number
  last_played_date: string | null
  total_coins: number
  unlocked_skins: string[]
  active_skin: string | null
  next_unlock_key: string | null
  next_unlock_at: number | null
}

export interface PlayerStats {
  nickname: string | null
  best_distance: number | null
  rank: number | null
}

export interface IncidentReportRequest {
  telegram_id?: number | null
  service_type: 'vpn' | 'mtproto'
  connection_type?: 'mobile' | 'wifi' | 'both' | null
  provider?: string | null
  city?: string | null
}

export interface IncidentReportResponse {
  id: number
  created_at: string
}

export interface HourlyBucket {
  hour: number
  vpn_count: number
  mtproto_count: number
  total: number
}

export interface IncidentBreakdownRow {
  label: string
  count: number
}

export interface ReportStatsResponse {
  buckets: HourlyBucket[]
  vpn_total: number
  mtproto_total: number
  grand_total: number
  by_connection_type: IncidentBreakdownRow[]
  by_provider: IncidentBreakdownRow[]
  by_city?: IncidentBreakdownRow[]
}

export interface CitySuggestion {
  value: string
  unrestricted_value?: string | null
}

export interface Device {
  id: number
  name: string
  is_enabled: boolean
  proxy_subscription_url: string | null
  marzban_username: string | null
  created_at: string
}

export interface DeviceListResponse {
  devices: Device[]
}

export interface MtProtoServerPublic {
  id: number
  name: string
  proxy_link: string
}

export interface MtProtoProxyStats {
  ext_connections: number
  /** Unix time (sec) from proxy stats */
  current_time: number
}

export interface SupportContext {
  has_vpn: boolean
  is_first_support: boolean
  existing_promo_code: string | null
  promo_code_activated: boolean
  bonus_label: string
}

export interface SupportPaymentResult {
  id: number
  status: string
  amount_rub: number
  provider: string
  payment_url: string | null
  bonus_type: string | null
  bonus_days: number | null
}

export interface SupportPaymentStatus {
  id: number
  status: string
  amount_rub: number
  provider: string
  paid_at: string | null
  bonus_type: string | null
  bonus_days: number | null
  promo_code: string | null
}

export interface ActivatePromoCodeResult {
  days: number
  expires_at: string | null
}

export interface PaymentPreviewResult {
  type: 'discount' | 'days'
  days: number | null
  original_rub: number | null
  discounted_rub: number | null
  discount_amount_rub: number | null
}

export interface AddDeviceRequest {
  telegram_id: number
  name: string
}

export interface ToggleDeviceRequest {
  telegram_id: number
  enabled: boolean
}

export interface RenameDeviceRequest {
  telegram_id: number
  name: string
}
