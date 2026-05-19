import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { getUserPurchasedTemplateIds } from '@/lib/access-control'
import { TemplateSection } from '@/components/templates/template-section'
import { formatCurrency } from '@/lib/format'
import { Package, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Get all purchased template IDs
  const purchasedTemplateIds = await getUserPurchasedTemplateIds(user.id)

  // Get templates user can access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let accessibleTemplates: any[] = []
  if (purchasedTemplateIds.length > 0) {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .in('id', purchasedTemplateIds)
      .eq('is_published', true)
    accessibleTemplates = data ?? []
  }

  // Get recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {profile?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">Quản lý templates đã mua của bạn</p>
        </div>

        {/* Orders section */}
        {orders && orders.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h2>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{order.order_code}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{formatCurrency(order.total_amount)}</span>
                    <Badge
                      variant={order.status === 'confirmed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {order.status === 'confirmed' ? 'Đã xác nhận' : order.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Templates của bạn ({accessibleTemplates?.length ?? 0})
          </h2>

          {accessibleTemplates && accessibleTemplates.length > 0 ? (
            <TemplateSection
              templates={accessibleTemplates}
              purchasedIds={purchasedTemplateIds}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-4">📊</p>
              <h3 className="font-semibold text-gray-900 mb-2">Bạn chưa có template nào</h3>
              <p className="text-gray-500 text-sm mb-6">Mua template hoặc gói để bắt đầu</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/templates"
                  className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Xem templates
                </Link>
                <Link
                  href="/packages"
                  className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Xem gói mua
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
