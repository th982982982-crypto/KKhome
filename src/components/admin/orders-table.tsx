'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, X, Copy } from 'lucide-react'
import type { Order } from '@/lib/supabase/types'

interface OrderWithProfile extends Order {
  profiles?: { full_name: string | null } | null
}

export function OrdersTable({ orders: initialOrders, skuMap = {} }: { orders: OrderWithProfile[]; skuMap?: Record<string, string> }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  async function handleAction(orderId: string, action: 'confirm' | 'cancel') {
    if (action === 'cancel' && !confirm('Hủy đơn này?')) return
    setLoadingId(orderId)
    const endpoint = action === 'confirm' ? '/api/admin/confirm-order' : '/api/admin/cancel-order'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
    const data = await res.json()

    if (data.success) {
      const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled'
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      toast.success(action === 'confirm' ? 'Đã xác nhận đơn hàng' : 'Đã hủy đơn hàng')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const pending = orders.filter((o) => o.status === 'pending')
  const counts = {
    all: orders.length,
    pending: pending.length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'cancelled', label: 'Đã hủy' },
  ]

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="bg-yellow-50 dark:bg-amber-950/40 border border-yellow-100 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-amber-200">⏳ {pending.length} đơn chờ xác nhận</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95
              ${filter === tab.key
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Mã đơn</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Khách hàng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Gmail</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell whitespace-nowrap">Sản phẩm</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">SKU</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell whitespace-nowrap">Ghi chú</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Số tiền</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map((order) => {
              const items = order.items as { type: string; id: string; name: string; price: number }[]
              const skus = items.map(item => skuMap[item.id]).filter(Boolean)
              return (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-bold text-gray-900 dark:text-gray-50">{order.order_code}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <p>{order.profiles?.full_name || 'Khách vãng lai'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {order.email ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[180px]">{order.email}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(order.email!); toast.success('Đã copy email') }}
                          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Copy email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {items.map((item, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-300 truncate max-w-48">{item.name}</p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {skus.length > 0 ? (
                      <div className="space-y-0.5">
                        {skus.map((sku, i) => (
                          <p key={i} className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded w-fit">{sku}</p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {order.bank_transfer_note ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300 max-w-[140px] truncate" title={order.bank_transfer_note}>{order.bank_transfer_note}</p>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-50">
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
                    {order.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-8 text-xs"
                          onClick={() => handleAction(order.id, 'confirm')}
                          disabled={loadingId === order.id}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Xác nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 dark:bg-transparent"
                          onClick={() => handleAction(order.id, 'cancel')}
                          disabled={loadingId === order.id}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Hủy
                        </Button>
                      </div>
                    ) : order.status === 'confirmed' ? (
                      <span className="text-xs text-green-600 dark:text-emerald-400 font-medium">✓ Đã cấp quyền</span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Không có đơn hàng nào trong mục này</p>
          </div>
        )}
      </div>
    </div>
  )
}
