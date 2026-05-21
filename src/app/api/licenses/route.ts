import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// Customer: get license keys for their own order
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  // Verify order belongs to this user (or guest order matched by email)
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, email, status')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Allow if logged-in user owns the order, or if it's a guest order
  const isOwner = user && order.user_id === user.id
  const isGuest = !order.user_id
  if (!isOwner && !isGuest) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: licenses } = await admin
    .from('licenses')
    .select('id, license_key, template_id, status')
    .eq('order_id', orderId)

  if (!licenses || licenses.length === 0) {
    return NextResponse.json([])
  }

  const templateIds = licenses.map((l) => l.template_id).filter(Boolean) as string[]
  const { data: templates } = await admin
    .from('templates')
    .select('id, name, google_sheet_copy_url')
    .in('id', templateIds)

  const templateMap = Object.fromEntries((templates ?? []).map((t) => [t.id, t]))

  const result = licenses.map((l) => ({
    id: l.id,
    license_key: l.license_key,
    status: l.status,
    template_id: l.template_id,
    template_name: l.template_id ? templateMap[l.template_id]?.name ?? 'Template' : 'Template',
    copy_url: l.template_id ? templateMap[l.template_id]?.google_sheet_copy_url ?? null : null,
  }))

  return NextResponse.json(result)
}
