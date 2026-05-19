'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import type { Order } from '@/lib/supabase/types'

interface OrderWithProfile extends Order {
  profiles?: { full_name: string | null } | null
}

export function OrdersTable({ orders: initialOrders }: { orders: OrderWithProfile[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleConfirm(orderId: string) {
    setLoadingId(orderId)
    const res = await fetch('/api/admin/confirm-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
    const data = await res.json()

    if (data.success) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'confirmed' as const } : o))
      toast.success('Đã xác nhận đơn hàng và cấp quyền truy cập')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
  }

  const pending = orders.filter((o) => o.status === 'pending')
  const rest = orders.filter((o) => o.status !== 'pending')

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-2">
          <p className="text-sm font-semibold text-yellow-800">⏳ {pending.length} đơn chờ xác nhận</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã đơn</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Sản phẩm</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Số tiền</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...pending, ...rest].map((order) => {
              const items = order.items as { type: string; name: string; price: number }[]
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-gray-900">{order.order_code}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.profiles?.full_name || 'Ẩn danh'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {items.map((item, i) => (
                        <p key={i} className="text-gray-600 truncate max-w-48">{item.name}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={order.status === 'confirmed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                    >
                      {order.status === 'confirmed' ? 'Đã xác nhận' : order.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                        onClick={() => handleConfirm(order.id)}
                        disabled={loadingId === order.id}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {loadingId === order.id ? '...' : 'Xác nhận'}
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <span className="text-xs text-green-600 font-medium">✓ Đã cấp quyền</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
