import { createClient } from '@/lib/supabase/server'
import { OrdersTable } from '@/components/admin/orders-table'
import { ShoppingBag } from 'lucide-react'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  const list = orders ?? []
  const pending = list.filter((o) => o.status === 'pending').length
  const confirmed = list.filter((o) => o.status === 'confirmed').length

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1.5">
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn hàng</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-gray-500 mt-1">
            <span className="font-semibold text-gray-900">{list.length}</span> đơn hàng •{' '}
            <span className="text-amber-600 font-semibold">{pending}</span> chờ xác nhận •{' '}
            <span className="text-emerald-600 font-semibold">{confirmed}</span> đã xác nhận
          </p>
        </div>
      </div>

      <OrdersTable orders={list} />
    </div>
  )
}
