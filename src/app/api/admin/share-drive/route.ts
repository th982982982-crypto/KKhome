import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { order_id } = await req.json()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .eq('status', 'confirmed')
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found or not confirmed' }, { status: 404 })
  }

  const driveUrl = process.env.APPS_SCRIPT_DRIVE_URL
  if (!driveUrl || !order.email) {
    return NextResponse.json({ error: 'Drive sharing not configured' }, { status: 500 })
  }

  const items = order.items as { type: string; id: string }[]
  const templateIds = items.filter((i) => i.type === 'template').map((i) => i.id)
  const packageIds = items.filter((i) => i.type === 'package').map((i) => i.id)

  let allTemplateIds = [...templateIds]
  if (packageIds.length > 0) {
    const { data: pkgTemplates } = await supabase
      .from('package_templates')
      .select('template_id')
      .in('package_id', packageIds)
    pkgTemplates?.forEach((pt) => allTemplateIds.push(pt.template_id))
  }

  if (allTemplateIds.length === 0) {
    return NextResponse.json({ success: true })
  }

  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, google_sheet_embed_url, google_sheet_copy_url')
    .in('id', allTemplateIds)

  const fileIds = (templates ?? [])
    .map((t) => {
      const url = t.google_sheet_embed_url || t.google_sheet_copy_url
      const m = url?.match(/\/d\/([a-zA-Z0-9-_]+)/)
      return m ? m[1] : null
    })
    .filter(Boolean) as string[]

  if (fileIds.length === 0) {
    return NextResponse.json({ error: 'No Drive file IDs found' }, { status: 500 })
  }

  const res = await fetch(driveUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: order.email, fileIds }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Drive sharing failed: ' + text }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
