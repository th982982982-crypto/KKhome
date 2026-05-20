import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('*, promotion_templates(template_id)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const result = (data ?? []).map((p) => ({
    ...p,
    template_ids: (p.promotion_templates ?? []).map((pt: { template_id: string }) => pt.template_id),
    promotion_templates: undefined,
  }))
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { template_ids, ...body } = await req.json()
  const supabase = createAdminClient()
  const { data: promo, error } = await supabase.from('promotions').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (template_ids?.length) {
    await supabase.from('promotion_templates').insert(
      template_ids.map((tid: string) => ({ promotion_id: promo.id, template_id: tid }))
    )
  }
  return NextResponse.json({ ...promo, template_ids: template_ids ?? [] })
}
