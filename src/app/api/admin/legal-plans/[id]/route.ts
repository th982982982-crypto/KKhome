import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

const FIELDS = [
  'name', 'duration_months', 'price', 'original_price',
  'promo_price', 'promo_start_at', 'promo_end_at',
  'is_active', 'sort_order',
] as const

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const f of FIELDS) if (f in body) out[f] = body[f]
  return out
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('legal_plans')
    .update(pick(body) as never)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('legal_plans').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
