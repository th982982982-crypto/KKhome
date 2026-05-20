import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { template_ids, ...body } = await req.json()
  const supabase = createAdminClient()
  const { data: promo, error } = await supabase.from('promotions').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('promotion_templates').delete().eq('promotion_id', id)
  if (template_ids?.length) {
    await supabase.from('promotion_templates').insert(
      template_ids.map((tid: string) => ({ promotion_id: id, template_id: tid }))
    )
  }
  return NextResponse.json({ ...promo, template_ids: template_ids ?? [] })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
