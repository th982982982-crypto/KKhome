import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(0|\+84)\d{9,10}$/

function isValidUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

export async function POST(req: Request) {
  const { visitorId, name, email, phone } = await req.json()

  if (!isValidUuid(visitorId)) {
    return NextResponse.json({ error: 'Invalid visitorId' }, { status: 400 })
  }

  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const trimmedEmail = typeof email === 'string' ? email.trim() : ''
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : ''

  if (!trimmedName || trimmedName.length > 200) {
    return NextResponse.json({ error: 'Vui lòng nhập họ tên' }, { status: 400 })
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }
  if (!PHONE_RE.test(trimmedPhone)) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 })
  }

  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: existing } = await admin
    .from('support_conversations')
    .select('id, user_id')
    .eq('visitor_id', visitorId)
    .maybeSingle()

  const guestPayload = { guest_name: trimmedName, guest_email: trimmedEmail, guest_phone: trimmedPhone }

  if (!existing) {
    const { data: created, error } = await admin
      .from('support_conversations')
      .insert({
        visitor_id: visitorId,
        user_id: user?.id ?? null,
        last_message_at: now,
        last_customer_message_at: null,
        last_admin_message_at: null,
        admin_last_read_at: null,
        customer_last_read_at: now,
        ...guestPayload,
      })
      .select('id')
      .single()
    if (error || !created) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
    return NextResponse.json({ conversationId: created.id })
  }

  const updatePayload: Record<string, unknown> = { ...guestPayload }
  if (!existing.user_id && user) updatePayload.user_id = user.id

  const { error } = await admin
    .from('support_conversations')
    .update(updatePayload)
    .eq('id', existing.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversationId: existing.id })
}
