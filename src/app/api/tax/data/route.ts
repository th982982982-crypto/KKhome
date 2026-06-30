import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: files } = await supabase
    .from('tax_files')
    .select('*')
    .eq('user_id', user.id)
    .order('tax_year', { ascending: false })
    .order('tax_period', { ascending: false })
    .order('uploaded_at', { ascending: false })

  // Collect company names from payments (ten_nnop is always populated from GNT XML)
  const { data: payments } = await supabase
    .from('tax_payments')
    .select('mst, ten_nnop')
    .eq('user_id', user.id)
    .not('ten_nnop', 'is', null)

  const mstNames: Record<string, string> = {}
  for (const p of payments ?? []) {
    if (p.ten_nnop && !mstNames[p.mst]) mstNames[p.mst] = p.ten_nnop
  }

  return NextResponse.json({ files: files ?? [], mstNames })
}
