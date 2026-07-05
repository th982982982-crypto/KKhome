import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONTENT_LENGTH = 4000
const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\//

function isValidUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const visitorId = searchParams.get('visitorId')
  const markRead = searchParams.get('markRead') === '1'

  if (!isValidUuid(visitorId)) {
    return NextResponse.json({ error: 'Invalid visitorId' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: conversation } = await admin
    .from('support_conversations')
    .select('id, last_admin_message_at, customer_last_read_at, admin_last_read_at')
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [], unread: false, adminLastReadAt: null })
  }

  const { data: messages } = await admin
    .from('support_messages')
    .select('id, sender, content, attachment_url, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  const unread = !!conversation.last_admin_message_at &&
    (!conversation.customer_last_read_at || conversation.last_admin_message_at > conversation.customer_last_read_at)

  if (markRead) {
    await admin
      .from('support_conversations')
      .update({ customer_last_read_at: new Date().toISOString() })
      .eq('id', conversation.id)
  }

  return NextResponse.json({
    conversation: { id: conversation.id },
    messages: messages ?? [],
    unread,
    adminLastReadAt: conversation.admin_last_read_at,
  })
}

export async function POST(req: Request) {
  const { visitorId, content, attachmentUrl } = await req.json()

  if (!isValidUuid(visitorId)) {
    return NextResponse.json({ error: 'Invalid visitorId' }, { status: 400 })
  }
  const trimmed = typeof content === 'string' ? content.trim() : ''
  const trimmedAttachment = typeof attachmentUrl === 'string' ? attachmentUrl.trim() : ''
  if (trimmedAttachment && !CLOUDINARY_URL_RE.test(trimmedAttachment)) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 })
  }
  if ((!trimmed && !trimmedAttachment) || trimmed.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
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

  let conversationId: string
  const isNewConversation = !existing

  if (!existing) {
    const { data: created, error } = await admin
      .from('support_conversations')
      .insert({
        visitor_id: visitorId,
        user_id: user?.id ?? null,
        last_message_at: now,
        last_customer_message_at: now,
        last_admin_message_at: null,
        admin_last_read_at: null,
        customer_last_read_at: now,
      })
      .select('id')
      .single()
    if (error || !created) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
    conversationId = created.id
  } else {
    conversationId = existing.id
    const updatePayload: Record<string, unknown> = {
      last_message_at: now,
      last_customer_message_at: now,
      customer_last_read_at: now,
    }
    if (!existing.user_id && user) updatePayload.user_id = user.id

    const { error } = await admin
      .from('support_conversations')
      .update(updatePayload)
      .eq('id', conversationId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: message, error: messageError } = await admin
    .from('support_messages')
    .insert({
      conversation_id: conversationId,
      sender: 'customer',
      content: trimmed,
      attachment_url: trimmedAttachment || null,
    })
    .select('id, sender, content, attachment_url, created_at')
    .single()

  if (messageError || !message) {
    return NextResponse.json({ error: messageError?.message ?? 'Insert failed' }, { status: 500 })
  }

  let autoReplyMessage = null
  if (isNewConversation) {
    const { data: settings } = await admin
      .from('site_settings')
      .select('support_auto_reply_enabled, support_auto_reply_text')
      .limit(1)
      .single()

    const autoReplyText = settings?.support_auto_reply_text?.trim()
    if (settings?.support_auto_reply_enabled && autoReplyText) {
      const replyNow = new Date().toISOString()
      const { data: reply } = await admin
        .from('support_messages')
        .insert({ conversation_id: conversationId, sender: 'admin', content: autoReplyText })
        .select('id, sender, content, attachment_url, created_at')
        .single()

      if (reply) {
        autoReplyMessage = reply
        await admin
          .from('support_conversations')
          .update({ last_message_at: replyNow, last_admin_message_at: replyNow })
          .eq('id', conversationId)
      }
    }
  }

  return NextResponse.json({ conversationId, message, autoReplyMessage })
}
