import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { order_id } = await req.json()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .eq('status', 'pending')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 })
  }

  await supabase
    .from('orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: adminUser.id })
    .eq('id', order_id)

  const items = order.items as { type: string; id: string; name: string; price: number }[]
  const purchases = items.map((item) => ({
    user_id: order.user_id,
    purchase_type: item.type as 'template' | 'package',
    template_id: item.type === 'template' ? item.id : null,
    package_id: item.type === 'package' ? item.id : null,
    order_id: order.id,
  }))

  const { error: purchaseError } = await supabase.from('user_purchases').insert(purchases)

  if (purchaseError) {
    return NextResponse.json({ error: purchaseError.message }, { status: 500 })
  }

  // Share Drive files with buyer email (fire-and-forget)
  const driveUrl = process.env.APPS_SCRIPT_DRIVE_URL
  if (driveUrl && order.email) {
    const templateIds = items
      .filter((i) => i.type === 'template')
      .map((i) => i.id)
    const packageIds = items
      .filter((i) => i.type === 'package')
      .map((i) => i.id)

    // Get template file IDs for direct template items
    let allTemplateIds = [...templateIds]

    // Get template IDs from packages
    if (packageIds.length > 0) {
      const { data: pkgTemplates } = await supabase
        .from('package_templates')
        .select('template_id')
        .in('package_id', packageIds)
      pkgTemplates?.forEach((pt) => allTemplateIds.push(pt.template_id))
    }

    if (allTemplateIds.length > 0) {
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

      if (fileIds.length > 0) {
        fetch(driveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: order.email, fileIds }),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ success: true })
}
