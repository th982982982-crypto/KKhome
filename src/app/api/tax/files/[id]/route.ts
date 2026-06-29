import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Fetch file — verify ownership
  const { data: file } = await admin.from('tax_files').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!file) return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 })

  // If deleting the active (ĐƯỢC CỘNG) version, restore latest THAY THẾ for same mst+type+period
  if (file.status === 'ĐƯỢC CỘNG') {
    const { data: prev } = await admin
      .from('tax_files')
      .select('id')
      .eq('user_id', user.id)
      .eq('mst', file.mst)
      .eq('declaration_type', file.declaration_type)
      .eq('tax_period', file.tax_period)
      .eq('status', 'THAY THẾ')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prev) {
      await admin.from('tax_files').update({ status: 'ĐƯỢC CỘNG' }).eq('id', prev.id)
    }
  }

  const { error } = await admin.from('tax_files').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
