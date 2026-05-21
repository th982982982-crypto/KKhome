import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { order_id } = await req.json()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .eq('status', 'pending')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 })
  }

  await supabase
    .from('orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: adminUser.id })
    .eq('id', order_id)

  const items = order.items as { type: string; id: string; name: string; price: number }[]
  const purchases = items.map((item) => ({
    user_id: order.user_id,
    purchase_type: item.type as 'template' | 'package',
    template_id: item.type === 'template' ? item.id : null,
    package_id: item.type === 'package' ? item.id : null,
    order_id: order.id,
  }))

  const { error: purchaseError } = await supabase.from('user_purchases').insert(purchases)

  if (purchaseError) {
    return NextResponse.json({ error: purchaseError.message }, { status: 500 })
  }

  // Drive sharing tạm tắt — bật lại khi quota Google reset

  return NextResponse.json({ success: true })
}
