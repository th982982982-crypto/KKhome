import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_conversations')
    .select('id, visitor_id, user_id, last_message_at, last_customer_message_at, last_admin_message_at, admin_last_read_at, profiles(full_name)')
    .order('last_message_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const conversations = (data ?? []).map((c) => ({
    ...c,
    unread: !!c.last_customer_message_at &&
      (!c.admin_last_read_at || c.last_customer_message_at > c.admin_last_read_at),
  }))

  return NextResponse.json({ conversations })
}
