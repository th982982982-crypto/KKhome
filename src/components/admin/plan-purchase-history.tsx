'use client'

import { Receipt, Scale, FileSpreadsheet, Clock } from 'lucide-react'

interface PlanOrderItem {
  id: string
  name: string
  type: 'legal_plan' | 'tax_plan'
  price: number
  duration_months?: number
}

interface PlanOrder {
  id: string
  email: string
  full_name: string | null
  confirmed_at: string | null
  items: PlanOrderItem[]
}

interface Props {
  orders: PlanOrder[]
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(months: number | undefined) {
  if (!months && months !== 0) return '—'
  if (months === 0) return 'Trọn đời'
  if (months < 12) return `${months} tháng`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y} năm ${m} tháng` : `${y} năm`
}

function fmtMoney(v: number) {
  return v.toLocaleString('vi-VN') + ' ₫'
}

export function PlanPurchaseHistory({ orders }: Props) {
  if (!orders.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">Chưa có giao dịch mua gói nào</p>
      </div>
    )
  }

  // Flatten orders → individual plan items
  const rows = orders.flatMap((o) =>
    o.items
      .filter((i) => i.type === 'legal_plan' || i.type === 'tax_plan')
      .map((item) => ({ order: o, item }))
  )

  return (
    <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Người dùng</th>
            <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Loại gói</th>
            <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Tên gói</th>
            <th className="text-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">Thời hạn</th>
            <th className="text-right px-4 py-3 border-b border-gray-200 dark:border-gray-700">Giá</th>
            <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Ngày mua</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ order, item }, i) => (
            <tr key={`${order.id}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-gray-50 text-xs">{order.email}</p>
                {order.full_name && <p className="text-xs text-gray-400 mt-0.5">{order.full_name}</p>}
              </td>
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                {item.type === 'legal_plan' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    <Scale className="w-3 h-3" /> Pháp luật
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                    <FileSpreadsheet className="w-3 h-3" /> Tờ Khai
                  </span>
                )}
              </td>
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-800 dark:text-gray-200">
                {item.name}
              </td>
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  {fmtDuration(item.duration_months)}
                </span>
              </td>
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {fmtMoney(item.price)}
              </td>
              <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {fmtDate(order.confirmed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
