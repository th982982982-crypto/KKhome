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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('legal_plans')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('duration_months', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('legal_plans')
    .insert(pick(body) as never)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
