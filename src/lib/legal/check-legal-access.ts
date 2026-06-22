import { createClient } from '../supabase/server'
import { hasLegalAccess } from './has-legal-access'

export async function checkLegalAccess(): Promise<{ allowed: boolean; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, legal_access_until')
    .eq('id', user.id)
    .single()

  return hasLegalAccess(profile) ? { allowed: true, userId: user.id } : { allowed: false }
}
