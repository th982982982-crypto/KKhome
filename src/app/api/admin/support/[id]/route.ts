import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const supabase = createAdminClient()
  const { data: messages, error } = await supabase
    .from('support_messages')
    .select('id, sender, content, attachment_url, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: conversation } = await supabase
    .from('support_conversations')
    .select('customer_last_read_at, guest_name, guest_email, guest_phone')
    .eq('id', id)
    .single()

  await supabase
    .from('support_conversations')
    .update({ admin_last_read_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({
    messages: messages ?? [],
    conversation: {
      customer_last_read_at: conversation?.customer_last_read_at ?? null,
      guest_name: conversation?.guest_name ?? null,
      guest_email: conversation?.guest_email ?? null,
      guest_phone: conversation?.guest_phone ?? null,
    },
  })
}
