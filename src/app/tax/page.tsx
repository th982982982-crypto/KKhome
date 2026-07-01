import { createClient } from '@/lib/supabase/server'
import { getTaxAccessStatus, isTaxTrialExpired, canStartTrial } from '@/lib/tax/has-tax-access'
import { TaxShell } from '@/components/tax/tax-shell'

export const revalidate = 0

export default async function TaxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: settings } = await supabase.from('site_settings').select('tax_trial_days').single()
  const trialDays = settings?.tax_trial_days ?? 14

  if (!user) {
    return (
      <TaxShell
        hasAccess={false}
        isTrial={false}
        trialDaysLeft={0}
        accessUntil={null}
        trialExpired={false}
        canStartTrial={false}
        trialDays={trialDays}
        isLoggedIn={false}
      />
    )
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { hasAccess, isTrial, trialDaysLeft } = getTaxAccessStatus(profile, trialDays)
  const trialExpired = isTaxTrialExpired(profile, trialDays)
  const canTrial = canStartTrial(profile)

  return (
    <TaxShell
      hasAccess={hasAccess}
      isTrial={isTrial}
      trialDaysLeft={trialDaysLeft}
      accessUntil={profile?.tax_access_until ?? null}
      trialExpired={trialExpired}
      canStartTrial={canTrial}
      trialDays={trialDays}
      isLoggedIn={true}
    />
  )
}
