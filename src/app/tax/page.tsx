import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { TaxShell } from '@/components/tax/tax-shell'

export const revalidate = 0

export default async function TaxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <TaxShell
      hasAccess={hasTaxAccess(profile)}
      accessUntil={profile?.tax_access_until ?? null}
    />
  )
}
