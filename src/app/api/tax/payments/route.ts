import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hasTaxAccess, hasTaxViewAccess } from '@/lib/tax/has-tax-access'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin, tax_trial_started_at').eq('id', user.id).single()
  if (!hasTaxViewAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: payments } = await supabase
    .from('tax_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('ngay_lap', { ascending: false })
    .order('uploaded_at', { ascending: false })

  return NextResponse.json({ payments: payments ?? [] })
}

// DELETE /api/tax/payments — xóa toàn bộ giấy nộp tiền của user
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin, tax_trial_started_at').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin.from('tax_payments').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
