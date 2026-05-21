import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'

function generateLicenseKey(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '').toUpperCase()
  return `KKH-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}`
}

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

  // Generate license keys — 1 key per template
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

  if (allTemplateIds.length > 0 && order.email) {
    const licenseRows = allTemplateIds.map((tid) => ({
      license_key: generateLicenseKey(),
      email: order.email as string,
      user_id: order.user_id,
      template_id: tid,
      order_id: order.id,
      status: 'active',
    }))
    await supabase.from('licenses').upsert(licenseRows, { onConflict: 'order_id,template_id', ignoreDuplicates: true })
  }

  // Drive sharing tạm tắt — bật lại khi quota Google reset

  return NextResponse.json({ success: true })
}
