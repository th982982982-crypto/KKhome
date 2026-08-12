import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parsePaymentXml, parseVnDate, getTag } from '@/lib/tax/payment-parser'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { logTaxUploadError } from '@/lib/tax/log-upload-error'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('tax_access_until, is_admin, tax_trial_started_at').eq('id', user.id).single()
  if (!hasTaxAccess(profile)) return NextResponse.json({ error: 'Bạn chưa có quyền truy cập chức năng Tờ Khai Thuế' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const xmlText = await file.text()
  let parsed
  try {
    parsed = parsePaymentXml(xmlText)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Không thể đọc file XML giấy nộp tiền'
    logTaxUploadError({
      userId: user.id,
      fileName: file.name,
      source: 'tax_payment_upload',
      errorMessage: message,
      rawXml: xmlText,
      mst: getTag(xmlText, 'MST_NNOP') || null,
      tenNnt: getTag(xmlText, 'TEN_NNOP') || null,
    }).catch(() => {})
    return NextResponse.json(
      { error: `${message} — Hệ thống đã ghi nhận file này, đội ngũ sẽ kiểm tra và xử lý.` },
      { status: 422 }
    )
  }

  const admin = createAdminClient()

  // Prevent duplicate: same ma_thamchieu + user
  if (parsed.maThamChieu) {
    const { data: existing } = await admin
      .from('tax_payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('ma_thamchieu', parsed.maThamChieu)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: `Giấy nộp tiền này đã được tải lên (mã tham chiếu: ${parsed.maThamChieu})` }, { status: 409 })
    }
  }

  const { data: record, error } = await admin
    .from('tax_payments')
    .insert({
      user_id: user.id,
      file_name: file.name,
      mst: parsed.mst,
      ten_nnop: parsed.tenNNop || null,
      hthuc_nop: parsed.hthucNop || null,
      so_gnt: parsed.soGnt || null,
      ma_thamchieu: parsed.maThamChieu || null,
      ngay_lap: parseVnDate(parsed.ngayLap),
      tong_tien: parsed.tongTien || null,
      ten_cqt: parsed.tenCqt || null,
      ma_nhang_nop: parsed.maNhangNop || null,
      ten_nhang_nop: parsed.tenNhangNop || null,
      stk_nhang_nop: parsed.stkNhangNop || null,
      chi_tiet: parsed.chiTiet,
    })
    .select('id')
    .single()

  if (error || !record) {
    return NextResponse.json({ error: error?.message ?? 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: record.id, mst: parsed.mst, tongTien: parsed.tongTien })
}
