import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function PATCH(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { user_id, can_view_legal, legal_access_until } = body as {
    user_id?: string
    can_view_legal?: boolean
    legal_access_until?: string | null
  }

  if (!user_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Ưu tiên ngày hết hạn cụ thể nếu admin truyền vào; ngược lại dùng cờ boolean
  // (cấp = vĩnh viễn 'infinity', thu hồi = null).
  let until: string | null
  if (legal_access_until !== undefined) {
    until = legal_access_until
  } else if (typeof can_view_legal === 'boolean') {
    until = can_view_legal ? 'infinity' : null
  } else {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ legal_access_until: until })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
