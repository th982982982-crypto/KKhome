import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

const ALLOWED_FIELDS = [
  'tax_access_until',
  'tax_trial_started_at',
  'tax_trial_count',
  'tax_trial_max_count',
  'tax_trial_bonus_days',
] as const

export async function PATCH(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { user_id } = body as { user_id?: string }
  if (!user_id) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const update: Record<string, string | number | null> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field] ?? null
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').update(update).eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
