import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public endpoint — checkout page dùng để poll trạng thái đơn (bypass RLS)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select('status, cancel_note')
    .eq('id', orderId)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ status: data.status, cancel_note: data.cancel_note })
}
