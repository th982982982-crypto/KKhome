import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateOrderCode } from '@/lib/format'

export async function POST(req: Request) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { items, total, note } = await req.json()

  if (!items?.length || !total) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const order_code = generateOrderCode()

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      order_code,
      user_id: user.id,
      items,
      total_amount: total,
      status: 'pending',
      bank_transfer_note: note || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order_code: order.order_code, order_id: order.id })
}
