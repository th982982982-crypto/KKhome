import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTaxAccessStatus, isTaxTrialExpired } from '@/lib/tax/has-tax-access'
import { TaxShell } from '@/components/tax/tax-shell'

export const revalidate = 0

export default async function TaxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('site_settings').select('tax_trial_days').single(),
  ])

  const trialDays = settings?.tax_trial_days ?? 14
  const { hasAccess, isTrial, trialDaysLeft } = getTaxAccessStatus(profile, trialDays)
  const trialExpired = isTaxTrialExpired(profile, trialDays)

  return (
    <TaxShell
      hasAccess={hasAccess}
      isTrial={isTrial}
      trialDaysLeft={trialDaysLeft}
      accessUntil={profile?.tax_access_until ?? null}
      trialExpired={trialExpired}
    />
  )
}
