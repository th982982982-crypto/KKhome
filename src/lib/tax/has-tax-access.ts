import type { Profile } from '../supabase/types'

type TaxProfile = Pick<Profile, 'is_admin' | 'tax_access_until'> & { tax_trial_started_at?: string | null }

export interface TaxAccessStatus {
  hasAccess: boolean
  /** true nếu đang trong thời gian dùng thử (chưa mua gói) */
  isTrial: boolean
  /** Số ngày còn lại của trial (0 nếu không còn hoặc đã mua gói) */
  trialDaysLeft: number
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

  // Kiểm tra trial
  if (profile.tax_trial_started_at) {
    const trialEnd = new Date(profile.tax_trial_started_at).getTime() + trialDays * 24 * 60 * 60 * 1000
    const remaining = trialEnd - Date.now()
    if (remaining > 0) {
      const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000))
      return { hasAccess: true, isTrial: true, trialDaysLeft: daysLeft }
    }
  }

  return { hasAccess: false, isTrial: false, trialDaysLeft: 0 }
}

/** Backward-compatible boolean check */
export function hasTaxAccess(
  profile: TaxProfile | null | undefined,
  trialDays = 14
): boolean {
  return getTaxAccessStatus(profile, trialDays).hasAccess
}
