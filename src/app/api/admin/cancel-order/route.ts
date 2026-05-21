import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { order_id, cancel_note } = await req.json()

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', cancel_note: cancel_note || null })
    .eq('id', order_id)
    .in('status', ['pending', 'confirmed'])
    .select()
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
