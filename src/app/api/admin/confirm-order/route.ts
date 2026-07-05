import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'
import { addMonths } from '@/lib/format'
import type { OrderItem } from '@/lib/supabase/types'

// Khách mua Tờ Khai Thuế lần đầu tiên được tặng thêm 7 ngày dùng thử
const FIRST_ORDER_TAX_BONUS_DAYS = 7

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

  const { count: priorConfirmedCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', order.user_id)
    .eq('status', 'confirmed')
  const isFirstOrder = (priorConfirmedCount ?? 0) === 0

  await supabase
    .from('orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: adminUser.id })
    .eq('id', order_id)

  const items = order.items as OrderItem[]

  // Template/package → user_purchases (chỉ insert khi có)
  const purchases = items
    .filter((item) => item.type !== 'legal_plan' && item.type !== 'tax_plan')
    .map((item) => ({
      user_id: order.user_id,
      purchase_type: item.type as 'template' | 'package',
      template_id: item.type === 'template' ? item.id : null,
      package_id: item.type === 'package' ? item.id : null,
      order_id: order.id,
    }))

  if (purchases.length > 0) {
    const { error: purchaseError } = await supabase.from('user_purchases').insert(purchases)
    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 500 })
    }
  }

  // Gói Pháp luật → cộng dồn thời hạn vào profiles.legal_access_until
  const legalItems = items.filter((item) => item.type === 'legal_plan')
  if (legalItems.length > 0) {
    if (!order.user_id) {
      return NextResponse.json({ error: 'Đơn Pháp luật thiếu user_id' }, { status: 400 })
    }

    // Lấy thời hạn thật từ DB (fallback snapshot nếu gói đã bị xoá)
    const planIds = legalItems.map((i) => i.id)
    const { data: plans } = await supabase
      .from('legal_plans')
      .select('id, duration_months')
      .in('id', planIds)

    let totalMonths = 0
    for (const item of legalItems) {
      const plan = plans?.find((p) => p.id === item.id)
      const months = plan?.duration_months ?? item.duration_months
      if (months === undefined) {
        return NextResponse.json({ error: `Không xác định được thời hạn gói Pháp luật "${item.name}" (gói đã bị xoá và đơn thiếu dữ liệu thời hạn)` }, { status: 500 })
      }
      totalMonths += months
    }

    if (totalMonths > 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('legal_access_until')
        .eq('id', order.user_id)
        .single()

      const now = new Date()
      const current = prof?.legal_access_until ? new Date(prof.legal_access_until) : now

      // Đã vĩnh viễn (infinity → Invalid Date): bỏ qua, không cần gia hạn
      if (Number.isFinite(current.getTime())) {
        const base = current.getTime() > now.getTime() ? current : now
        const newExpiry = addMonths(base, totalMonths)
        const { error: grantError } = await supabase
          .from('profiles')
          .update({ legal_access_until: newExpiry.toISOString() })
          .eq('id', order.user_id)
        if (grantError) {
          return NextResponse.json({ error: grantError.message }, { status: 500 })
        }
      }
    }
  }

  // Gói Tờ Khai Thuế → cộng dồn thời hạn vào profiles.tax_access_until
  const taxItems = items.filter((item) => item.type === 'tax_plan')
  if (taxItems.length > 0) {
    if (!order.user_id) {
      return NextResponse.json({ error: 'Đơn Tax thiếu user_id' }, { status: 400 })
    }

    const planIds = taxItems.map((i) => i.id)
    const { data: taxPlans } = await supabase
      .from('tax_plans')
      .select('id, duration_months')
      .in('id', planIds)

    let totalMonths = 0
    let isLifetime = false
    for (const item of taxItems) {
      const plan = taxPlans?.find((p) => p.id === item.id)
      const months = plan?.duration_months ?? item.duration_months
      if (months === undefined) {
        return NextResponse.json({ error: `Không xác định được thời hạn gói Tờ Khai Thuế "${item.name}" (gói đã bị xoá và đơn thiếu dữ liệu thời hạn)` }, { status: 500 })
      }
      if (months === 0) {
        isLifetime = true  // duration_months = 0 → gói vĩnh viễn
      } else {
        totalMonths += months
      }
    }

    if (isLifetime) {
      // Vĩnh viễn: set 'infinity' (Postgres timestamptz infinity)
      const { error: grantError } = await supabase
        .from('profiles')
        .update({ tax_access_until: 'infinity' })
        .eq('id', order.user_id)
      if (grantError) return NextResponse.json({ error: grantError.message }, { status: 500 })
    } else if (totalMonths > 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('tax_access_until')
        .eq('id', order.user_id)
        .single()

      const now = new Date()
      const current = prof?.tax_access_until ? new Date(prof.tax_access_until) : now
      if (Number.isFinite(current.getTime())) {
        const base = current.getTime() > now.getTime() ? current : now
        const newExpiry = addMonths(base, totalMonths)
        if (isFirstOrder) {
          newExpiry.setDate(newExpiry.getDate() + FIRST_ORDER_TAX_BONUS_DAYS)
        }
        const { error: grantError } = await supabase
          .from('profiles')
          .update({ tax_access_until: newExpiry.toISOString() })
          .eq('id', order.user_id)
        if (grantError) return NextResponse.json({ error: grantError.message }, { status: 500 })
      }
    }
  }

  // Drive sharing tạm tắt — bật lại khi quota Google reset

  return NextResponse.json({ success: true })
}
