import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateOrderCode } from '@/lib/format'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  const { items, total, note, email } = await req.json()

  if (!items?.length || typeof total !== 'number' || total <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()

  // Gói Pháp luật gắn quyền theo user → bắt buộc đăng nhập
  const hasLegalPlan = (items as { type: string }[]).some((i) => i.type === 'legal_plan')
  if (hasLegalPlan && !user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập để mua gói Pháp luật' }, { status: 401 })
  }

  const admin = createAdminClient()
  const order_code = generateOrderCode()

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      order_code,
      user_id: user?.id ?? null,
      email,
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
