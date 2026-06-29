import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseXmlText } from '@/lib/tax/xml-parser'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await supabase.from('profiles').select('tax_access_until, is_admin').eq('id', user.id).single()
  const p = profile.data
  const hasAccess = p?.is_admin || (p?.tax_access_until && new Date(p.tax_access_until).getTime() > Date.now())
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const xmlText = await file.text()
  let parsed
  try {
    parsed = parseXmlText(xmlText)
  } catch {
    return NextResponse.json({ error: 'Không thể đọc file XML' }, { status: 422 })
  }

  const admin = createAdminClient()

  // Upload XML to Supabase Storage
  const storagePath = `${user.id}/${parsed.mst}/${parsed.taxYear}/${parsed.declarationType}/${file.name}`
  await admin.storage.from('tax-xml').upload(storagePath, new Blob([xmlText], { type: 'application/xml' }), { upsert: true })

  // Version control: mark old records as THAY THẾ
  await admin
    .from('tax_data_rows')
    .update({ status: 'THAY THẾ' })
    .eq('user_id', user.id)
    .eq('mst', parsed.mst)
    .eq('declaration_type', parsed.declarationType)
    .eq('tax_period', parsed.kyKKhai)
    .eq('status', 'ĐƯỢC CỘNG')

  await admin
    .from('tax_files')
    .update({ status: 'THAY THẾ' })
    .eq('user_id', user.id)
    .eq('mst', parsed.mst)
    .eq('declaration_type', parsed.declarationType)
    .eq('tax_period', parsed.kyKKhai)
    .eq('status', 'ĐƯỢC CỘNG')

  // Insert file record
  const { data: fileRecord, error: fileErr } = await admin
    .from('tax_files')
    .insert({
      user_id: user.id,
      file_name: file.name,
      mst: parsed.mst,
      declaration_type: parsed.declarationType,
      tax_period: parsed.kyKKhai,
      tax_year: parsed.taxYear,
      khai_type: parsed.loaiKhai || null,
      so_lan: parsed.soLan || null,
      nguoi_ky: parsed.nguoiKy || null,
      storage_path: storagePath,
      status: 'ĐƯỢC CỘNG',
    })
    .select('id')
    .single()

  if (fileErr || !fileRecord) {
    return NextResponse.json({ error: fileErr?.message ?? 'DB error' }, { status: 500 })
  }

  // Insert flat indicator rows
  const rows = Object.entries(parsed.indicators).map(([code, value]) => ({
    user_id: user.id,
    file_id: fileRecord.id,
    mst: parsed.mst,
    declaration_type: parsed.declarationType,
    tax_period: parsed.kyKKhai,
    tax_year: parsed.taxYear,
    khai_type: parsed.loaiKhai || null,
    so_lan: parsed.soLan || null,
    indicator_code: code,
    value,
    status: 'ĐƯỢC CỘNG',
  }))

  const { error: rowsErr } = await admin.from('tax_data_rows').insert(rows)
  if (rowsErr) return NextResponse.json({ error: rowsErr.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    file: { id: fileRecord.id, mst: parsed.mst, period: parsed.kyKKhai, type: parsed.declarationType },
  })
}
