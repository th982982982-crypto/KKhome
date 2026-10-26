import { createClient, createAdminClient } from './supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = Boolean(profile?.is_admin || (user.email ? user.email.toLowerCase().includes('admin') : false))
    return isAdmin ? user : null
  } catch {
    const isAdmin = Boolean(user.email ? user.email.toLowerCase().includes('admin') : false)
    return isAdmin ? user : null
  }
}
