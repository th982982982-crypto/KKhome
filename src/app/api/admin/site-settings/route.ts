import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function PATCH(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    'brand_name', 'brand_description',
    'contact_hours', 'contact_phone', 'contact_email', 'contact_address',
    'facebook_url', 'zalo_url', 'youtube_url',
    'copyright_text',
  ]
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) payload[key] = body[key]
  }

  const supabase = createAdminClient()
  const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single()
  if (!existing) return NextResponse.json({ error: 'Settings row missing' }, { status: 500 })

  const { data, error } = await supabase
    .from('site_settings')
    .update(payload)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
