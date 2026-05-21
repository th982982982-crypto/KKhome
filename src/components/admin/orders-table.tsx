'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Copy, CircleDollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Order } from '@/lib/supabase/types'

interface OrderWithProfile extends Order {
  profiles?: { full_name: string | null } | null
}

const statusStyle: Record<Order['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabel: Record<Order['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã thanh toán',
  cancelled: 'Đã hủy',
}

export function OrdersTable({ orders: initialOrders, skuMap = {} }: { orders: OrderWithProfile[]; skuMap?: Record<string, string> }) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [cancelTarget, setCancelTarget] = useState<{ id: string; code: string } | null>(null)
  const [cancelNote, setCancelNote] = useState('')

  async function handleConfirm(orderId: string) {
    setLoadingId(orderId)
    const res = await fetch('/api/admin/confirm-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    })
    const data = await res.json()
    if (data.success) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'confirmed' as Order['status'] } : o))
      toast.success('Đã xác nhận đơn hàng')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
  }

  async function toggleDriveShared(orderId: string, value: boolean) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, drive_shared: value } : o))
    const res = await fetch('/api/admin/toggle-drive-shared', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, drive_shared: value }),
    })
    const data = await res.json()
    if (!data.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, drive_shared: !value } : o))
      toast.error(data.error || 'Có lỗi xảy ra')
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    setLoadingId(cancelTarget.id)
    const res = await fetch('/api/admin/cancel-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: cancelTarget.id, cancel_note: cancelNote }),
    })
    const data = await res.json()
    if (data.success) {
      setOrders((prev) => prev.map((o) => o.id === cancelTarget.id ? { ...o, status: 'cancelled' as Order['status'], cancel_note: cancelNote || null } : o))
      toast.success('Đã hủy đơn hàng')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
    setCancelTarget(null)
    setCancelNote('')
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

  const thSticky = 'sticky bg-slate-100 dark:bg-gray-800/80 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.10)]'
  const thBase = 'px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap'

  return (
    <div className="space-y-4">
      {/* Cancel confirmation modal */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) { setCancelTarget(null); setCancelNote('') } }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Hủy đơn {cancelTarget?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Lý do hủy <span className="text-gray-400">(không bắt buộc)</span></label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              rows={3}
              placeholder="Ví dụ: Sai số tiền, khách không chuyển khoản..."
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setCancelTarget(null); setCancelNote('') }}
              disabled={!!loadingId}
            >
              Quay lại
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancelConfirm}
              disabled={!!loadingId}
            >
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">⏳ {pending.length} đơn chờ xác nhận</p>
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

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1300px]">
            <thead className="bg-slate-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className={`${thBase} text-left`}>Mã đơn</th>
                <th className={`${thBase} text-left`}>Khách hàng</th>
                <th className={`${thBase} text-left`}>Gmail</th>
                <th className={`${thBase} text-left`}>Sản phẩm</th>
                <th className={`${thBase} text-left`}>SKU</th>
                <th className={`${thBase} text-left`}>Ghi chú</th>
                <th className={`${thBase} text-right ${thSticky} right-[370px] w-[110px]`}>Số tiền</th>
                <th className={`${thBase} text-center ${thSticky} right-[230px] w-[140px]`}>Trạng thái</th>
                <th className={`${thBase} text-center ${thSticky} right-0 w-[230px]`}>Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
              {filtered.map((order, index) => {
                const items = order.items as { type: string; id: string; name: string; price: number }[]
                const skus = items.map(item => skuMap[item.id]).filter(Boolean)
                const rowBg = index % 2 === 0
                  ? 'bg-white dark:bg-gray-900'
                  : 'bg-slate-50 dark:bg-gray-800/90'
                return (
                  <tr key={order.id} className={`group transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 ${rowBg}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-50 text-xs">{order.order_code}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{order.profiles?.full_name || 'Khách vãng lai'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {order.email ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-700 dark:text-gray-200">{order.email}</span>
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
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="space-y-0.5">
                        {items.map((item, i) => (
                          <p key={i} className="text-sm text-gray-600 dark:text-gray-300 truncate" title={item.name}>{item.name}</p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {skus.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skus.map((sku, i) => (
                            <span key={i} className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">{sku}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[130px]">
                      {order.bank_transfer_note ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={order.bank_transfer_note}>{order.bank_transfer_note}</p>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                      {order.status === 'cancelled' && order.cancel_note && (
                        <p className="text-xs text-red-500 dark:text-red-400 truncate mt-0.5" title={order.cancel_note}>Lý do: {order.cancel_note}</p>
                      )}
                    </td>
                    {/* Số tiền — sticky column */}
                    <td className={`px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-50 whitespace-nowrap sticky right-[370px] w-[110px] ${rowBg} group-hover:bg-blue-50 dark:group-hover:bg-slate-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]`}>
                      {formatCurrency(order.total_amount)}
                    </td>
                    {/* Trạng thái — sticky column */}
                    <td className={`px-4 py-3 text-center whitespace-nowrap sticky right-[230px] w-[140px] ${rowBg} group-hover:bg-blue-50 dark:group-hover:bg-slate-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status]}`}>
                        {order.status === 'confirmed' && <CircleDollarSign className="w-3.5 h-3.5" />}
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    {/* Hành động — sticky column (gồm checkbox Cấp Drive + nút) */}
                    <td className={`px-4 py-3 whitespace-nowrap sticky right-0 w-[230px] ${rowBg} group-hover:bg-blue-50 dark:group-hover:bg-slate-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.10)]`}>
                      {order.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-8 px-3 text-xs whitespace-nowrap"
                            onClick={() => handleConfirm(order.id)}
                            disabled={loadingId === order.id}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs whitespace-nowrap border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 dark:bg-transparent"
                            onClick={() => { setCancelTarget({ id: order.id, code: order.order_code }); setCancelNote('') }}
                            disabled={loadingId === order.id}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      ) : order.status === 'confirmed' ? (
                        <div className="flex items-center justify-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap select-none">
                            <input
                              type="checkbox"
                              checked={order.drive_shared}
                              onChange={() => toggleDriveShared(order.id, !order.drive_shared)}
                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                            />
                            Cấp Drive
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs whitespace-nowrap border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 dark:bg-transparent"
                            onClick={() => { setCancelTarget({ id: order.id, code: order.order_code }); setCancelNote('') }}
                            disabled={loadingId === order.id}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex justify-center">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Không có đơn hàng nào trong mục này</p>
          </div>
        )}
      </div>
    </div>
  )
}
