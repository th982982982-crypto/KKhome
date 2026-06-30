import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseXmlText } from '@/lib/tax/xml-parser'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Bạn chưa có quyền truy cập chức năng Tờ Khai Thuế' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const xmlText = await file.text()
  let parsed
  try {
    parsed = parseXmlText(xmlText)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Không thể đọc file XML' }, { status: 422 })
  }

  const admin = createAdminClient()

  // Check for exact duplicate: same mst+type+period+khai_type+so_lan already ĐƯỢC CỘNG
  const { data: exactMatch } = await admin
    .from('tax_files')
    .select('id')
    .eq('user_id', user.id)
    .eq('mst', parsed.mst)
    .eq('declaration_type', parsed.declarationType)
    .eq('tax_period', parsed.kyKKhai)
    .eq('khai_type', parsed.loaiKhai || '')
    .eq('so_lan', parsed.soLan || '')
    .eq('status', 'ĐƯỢC CỘNG')
    .maybeSingle()

  let fileId: string

  if (exactMatch) {
    // Same declaration re-uploaded → overwrite data, no extra THAY THẾ column
    const { error } = await admin
      .from('tax_files')
      .update({
        file_name: file.name,
        ten_nnt: parsed.tenNNT || null,
        nguoi_ky: parsed.nguoiKy || null,
        indicators: parsed.indicators,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', exactMatch.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    fileId = exactMatch.id
  } else {
    // New or amended declaration → mark old ĐƯỢC CỘNG as THAY THẾ, insert new
    await admin
      .from('tax_files')
      .update({ status: 'THAY THẾ' })
      .eq('user_id', user.id)
      .eq('mst', parsed.mst)
      .eq('declaration_type', parsed.declarationType)
      .eq('tax_period', parsed.kyKKhai)
      .eq('status', 'ĐƯỢC CỘNG')

    const { data: fileRecord, error } = await admin
      .from('tax_files')
      .insert({
        user_id: user.id,
        file_name: file.name,
        mst: parsed.mst,
        ten_nnt: parsed.tenNNT || null,
        declaration_type: parsed.declarationType,
        tax_period: parsed.kyKKhai,
        tax_year: parsed.taxYear,
        khai_type: parsed.loaiKhai || null,
        so_lan: parsed.soLan || null,
        nguoi_ky: parsed.nguoiKy || null,
        indicators: parsed.indicators,
        status: 'ĐƯỢC CỘNG',
      })
      .select('id')
      .single()

    if (error || !fileRecord) {
      return NextResponse.json({ error: error?.message ?? 'DB error' }, { status: 500 })
    }
    fileId = fileRecord.id
  }

  return NextResponse.json({
    success: true,
    file: { id: fileId, mst: parsed.mst, tenNNT: parsed.tenNNT, period: parsed.kyKKhai, type: parsed.declarationType },
  })
}
