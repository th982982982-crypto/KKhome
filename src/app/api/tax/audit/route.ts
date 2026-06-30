import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runGtgtSequenceAudit, runRevenueCrossAudit } from '@/lib/tax/audit-engine'
import { hasTaxViewAccess } from '@/lib/tax/has-tax-access'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin, tax_trial_started_at').eq('id', user.id).single()
  if (!hasTaxViewAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const mst = new URL(req.url).searchParams.get('mst')
  if (!mst) return NextResponse.json({ error: 'mst required' }, { status: 400 })

  const { data: files } = await supabase
    .from('tax_files')
    .select('*')
    .eq('user_id', user.id)
    .eq('mst', mst)

  const allFiles = files ?? []

  return NextResponse.json({
    mst,
    gtgtAudit: runGtgtSequenceAudit(allFiles, mst),
    revenueAudit: runRevenueCrossAudit(allFiles, mst),
  })
}
