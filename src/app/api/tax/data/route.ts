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

  return NextResponse.json({ files: files ?? [] })
}
