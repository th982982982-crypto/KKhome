import type { Profile } from '../supabase/types'

/**
 * Nguồn sự thật duy nhất cho việc gating tab Pháp luật.
 * - Admin: luôn có quyền.
 * - User thường: có quyền khi legal_access_until > hiện tại ('infinity' = vĩnh viễn).
 */
export function hasLegalAccess(
  profile: Pick<Profile, 'is_admin' | 'legal_access_until'> | null | undefined
): boolean {
  if (!profile) return false
  if (profile.is_admin) return true
  if (!profile.legal_access_until) return false
  return new Date(profile.legal_access_until).getTime() > Date.now()
}
