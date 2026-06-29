import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: payments } = await supabase
    .from('tax_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('ngay_lap', { ascending: false })
    .order('uploaded_at', { ascending: false })

  return NextResponse.json({ payments: payments ?? [] })
}
