import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function PATCH(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { user_id, tax_access_until } = body as { user_id?: string; tax_access_until?: string | null }

  if (!user_id) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ tax_access_until: tax_access_until ?? null })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
