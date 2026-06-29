import type { Profile } from '../supabase/types'

export function hasTaxAccess(
  profile: Pick<Profile, 'is_admin' | 'tax_access_until'> | null | undefined
): boolean {
  if (!profile) return false
  if (profile.is_admin) return true
  if (!profile.tax_access_until) return false
  return new Date(profile.tax_access_until).getTime() > Date.now()
}
