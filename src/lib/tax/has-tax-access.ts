import type { Profile } from '../supabase/types'

type TaxProfile = Pick<Profile, 'is_admin' | 'tax_access_until'> & {
  tax_trial_started_at?: string | null
  tax_trial_count?: number | null
  tax_trial_max_count?: number | null
  tax_trial_bonus_days?: number | null
}

export interface TaxAccessStatus {
  hasAccess: boolean
  /** true nếu đang trong thời gian dùng thử (chưa mua gói) */
  isTrial: boolean
  /** Số ngày còn lại của trial (0 nếu không còn hoặc đã mua gói) */
  trialDaysLeft: number
}

function effectiveTrialDays(profile: TaxProfile, baseDays: number): number {
  return baseDays + (profile.tax_trial_bonus_days ?? 0)
}

export function getTaxAccessStatus(
  profile: TaxProfile | null | undefined,
  trialDays = 14
): TaxAccessStatus {
  if (!profile) return { hasAccess: false, isTrial: false, trialDaysLeft: 0 }
  if (profile.is_admin) return { hasAccess: true, isTrial: false, trialDaysLeft: 0 }

  // Đã mua gói hợp lệ
  if (profile.tax_access_until) {
    const t = new Date(profile.tax_access_until).getTime()
    if (!Number.isFinite(t) || t > Date.now()) {
      return { hasAccess: true, isTrial: false, trialDaysLeft: 0 }
    }
  }

  // Kiểm tra trial (bonus_days được cộng vào)
  if (profile.tax_trial_started_at) {
    const totalDays = effectiveTrialDays(profile, trialDays)
    const trialEnd = new Date(profile.tax_trial_started_at).getTime() + totalDays * 24 * 60 * 60 * 1000
    const remaining = trialEnd - Date.now()
    if (remaining > 0) {
      const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000))
      return { hasAccess: true, isTrial: true, trialDaysLeft: daysLeft }
    }
  }

  return { hasAccess: false, isTrial: false, trialDaysLeft: 0 }
}

/** Full access: admin OR valid subscription OR active trial */
export function hasTaxAccess(
  profile: TaxProfile | null | undefined,
  trialDays = 14
): boolean {
  return getTaxAccessStatus(profile, trialDays).hasAccess
}

/** View-only access: same as above PLUS expired trial (user đã từng dùng trial) */
export function hasTaxViewAccess(profile: TaxProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.is_admin) return true
  if (profile.tax_access_until) {
    const t = new Date(profile.tax_access_until).getTime()
    if (!Number.isFinite(t) || t > Date.now()) return true
  }
  // Trial đã bắt đầu (dù đã hết) → vẫn cho xem data
  return !!profile.tax_trial_started_at
}

/** True nếu trial đã bắt đầu nhưng đã hết hạn (và không có subscription) */
export function isTaxTrialExpired(
  profile: TaxProfile | null | undefined,
  trialDays = 14
): boolean {
  if (!profile || profile.is_admin) return false
  if (profile.tax_access_until) {
    const t = new Date(profile.tax_access_until).getTime()
    if (!Number.isFinite(t) || t > Date.now()) return false
  }
  if (!profile.tax_trial_started_at) return false
  const totalDays = effectiveTrialDays(profile, trialDays)
  const trialEnd = new Date(profile.tax_trial_started_at).getTime() + totalDays * 24 * 60 * 60 * 1000
  return Date.now() >= trialEnd
}

/** User có thể tự bấm bắt đầu trial không (chưa dùng hết quota) */
export function canStartTrial(profile: TaxProfile | null | undefined): boolean {
  if (!profile || profile.is_admin) return false
  // Đã có subscription thì không cần trial
  if (profile.tax_access_until) {
    const t = new Date(profile.tax_access_until).getTime()
    if (!Number.isFinite(t) || t > Date.now()) return false
  }
  // trial đang chạy rồi
  if (profile.tax_trial_started_at) return false
  // Còn quota trial
  const used = profile.tax_trial_count ?? 0
  const max = profile.tax_trial_max_count ?? 1
  return used < max
}
