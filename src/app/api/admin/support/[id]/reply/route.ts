import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'
const MAX_CONTENT_LENGTH = 4000
const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\//

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { content, attachmentUrl } = await req.json()
  const trimmed = typeof content === 'string' ? content.trim() : ''
  const trimmedAttachment = typeof attachmentUrl === 'string' ? attachmentUrl.trim() : ''
  if (trimmedAttachment && !CLOUDINARY_URL_RE.test(trimmedAttachment)) {
    return NextResponse.json({ error: 'Invalid attachment' }, { status: 400 })
  }
  if ((!trimmed && !trimmedAttachment) || trimmed.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: message, error } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: id,
      sender: 'admin',
      content: trimmed,
      attachment_url: trimmedAttachment || null,
    })
    .select('id, sender, content, attachment_url, created_at')
    .single()

  if (error || !message) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  await supabase
    .from('support_conversations')
    .update({ last_message_at: now, last_admin_message_at: now, admin_last_read_at: now })
    .eq('id', id)

  return NextResponse.json({ message })
}
