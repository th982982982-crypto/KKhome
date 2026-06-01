import { createClient } from '../supabase/server'

export async function checkLegalAccess(): Promise<{ allowed: boolean; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, can_view_legal')
    .eq('id', user.id)
    .single()

  if (!profile) return { allowed: false }
  if (profile.is_admin || profile.can_view_legal) return { allowed: true, userId: user.id }
  return { allowed: false }
}
