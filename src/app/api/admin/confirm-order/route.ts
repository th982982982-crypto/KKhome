import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: user.id })
    .eq('id', order_id)

  // Create user_purchases for each item
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

  return NextResponse.json({ success: true })
}
