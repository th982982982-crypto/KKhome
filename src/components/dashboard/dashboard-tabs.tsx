'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Template } from '@/lib/supabase/types'
import { TemplateSection } from '@/components/templates/template-section'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { Package, Clock, LayoutGrid, Receipt, X, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface OrderRow {
  id: string
  order_code: string
  total_amount: number
  status: string
  created_at: string
}

interface DashboardTabsProps {
  accessibleTemplates: Template[]
  purchasedIds: string[]
  orders: OrderRow[]
  bank: { name: string; account: string; owner: string; code: string }
}

const BANK_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
}

const BANK_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  confirmed: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  cancelled: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
}

export function DashboardTabs({ accessibleTemplates, purchasedIds, orders, bank }: DashboardTabsProps) {
  const [tab, setTab] = useState<'templates' | 'orders'>(accessibleTemplates.length === 0 && orders.length > 0 ? 'orders' : 'templates')
  const [openOrder, setOpenOrder] = useState<OrderRow | null>(null)

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  const qrUrl = openOrder
    ? `https://img.vietqr.io/image/${bank.code}-${bank.account}-compact2.png?amount=${openOrder.total_amount}&addInfo=${encodeURIComponent(openOrder.order_code)}&accountName=${encodeURIComponent(bank.owner)}`
    : null

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('templates')}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              tab === 'templates' ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Templates của tôi
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'templates' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              {accessibleTemplates.length}
            </span>
            {tab === 'templates' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 dark:bg-gray-100 rounded-t-full" />}
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              tab === 'orders' ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Đơn hàng
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'orders' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              {orders.length}
            </span>
            {tab === 'orders' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 dark:bg-gray-100 rounded-t-full" />}
          </button>
        </div>
      </div>

      {/* Templates tab */}
      {tab === 'templates' && (
        accessibleTemplates.length > 0 ? (
          <TemplateSection templates={accessibleTemplates} purchasedIds={purchasedIds} />
        ) : (
          <EmptyState
            title="Bạn chưa có template nào"
            description="Mua template hoặc gói để bắt đầu sử dụng"
            illustration="templates"
            actions={
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/templates">
                  <Button className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl">Xem templates</Button>
                </Link>
                <Link href="/packages">
                  <Button variant="outline" className="rounded-xl">Xem gói mua</Button>
                </Link>
              </div>
            }
          />
        )
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap items-center gap-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-gray-50 text-sm">{order.order_code}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(order.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-50 shrink-0">{formatCurrency(order.total_amount)}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${BANK_STYLES[order.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                  {BANK_LABELS[order.status] || order.status}
                </span>
                {order.status === 'pending' && (
                  <button
                    onClick={() => setOpenOrder(order)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all shrink-0"
                  >
                    Xem thông tin CK
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Đơn hàng của bạn sẽ hiển thị tại đây sau khi mua templates"
            illustration="orders"
            actions={
              <Link href="/templates">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-xl">Khám phá templates</Button>
              </Link>
            }
          />
        )
      )}

      {/* Bank info dialog */}
      <Dialog open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)}>
        <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden border-0">
          <button
            onClick={() => setOpenOrder(null)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          {openOrder && qrUrl && (
            <>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center border-b border-amber-100">
                <h3 className="font-bold text-gray-900">Thông tin chuyển khoản</h3>
                <p className="text-xs text-gray-500 mt-1">Đơn hàng <span className="font-mono font-bold text-gray-900">{openOrder.order_code}</span></p>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-3 mb-4">
                  <Image src={qrUrl} alt="VietQR" width={240} height={240} className="rounded-xl" unoptimized />
                </div>
                <div className="w-full space-y-2 text-sm">
                  {[
                    { label: 'Ngân hàng', value: bank.name },
                    { label: 'Số tài khoản', value: bank.account, copy: true },
                    { label: 'Chủ TK', value: bank.owner },
                    { label: 'Số tiền', value: formatCurrency(openOrder.total_amount), copy: true, highlight: true },
                    { label: 'Nội dung CK', value: openOrder.order_code, copy: true, highlight: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500 shrink-0">{row.label}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-semibold truncate ${row.highlight ? 'text-blue-600' : 'text-gray-900'}`}>{row.value}</span>
                        {row.copy && (
                          <button onClick={() => copy(row.value, row.label)} className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 w-full">
                  ⚠️ Nội dung CK phải đúng <strong>{openOrder.order_code}</strong> để được xác nhận tự động.
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function EmptyState({
  title,
  description,
  illustration,
  actions,
}: {
  title: string
  description: string
  illustration: 'templates' | 'orders'
  actions: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center">
      <div className="w-24 h-24 mx-auto mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/60 dark:to-violet-950/60 rounded-3xl rotate-6" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/60 dark:to-orange-950/60 rounded-3xl -rotate-3" />
        <div className="relative w-full h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-center">
          {illustration === 'templates' ? (
            <LayoutGrid className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          ) : (
            <Receipt className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute -top-1 -right-1 bg-white dark:bg-gray-900 rounded-full" />
      </div>
      <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg mb-1">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      {actions}
    </div>
  )
}
