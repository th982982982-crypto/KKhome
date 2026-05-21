import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public endpoint — called from Apps Script in customer's Google Sheet
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const email = searchParams.get('email')
  const templateId = searchParams.get('template_id')

  if (!key || !email || !templateId) {
    return NextResponse.json({ valid: false, message: 'Thiếu thông tin xác thực' })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('licenses')
    .select('id, status')
    .eq('license_key', key)
    .eq('email', email.toLowerCase().trim())
    .eq('template_id', templateId)
    .single()

  if (!data) {
    return NextResponse.json({ valid: false, message: 'License key không hợp lệ hoặc email không khớp' })
  }

  if (data.status !== 'active') {
    return NextResponse.json({ valid: false, message: 'License đã bị tạm khóa hoặc thu hồi' })
  }

  return NextResponse.json({ valid: true, message: 'OK' })
}
