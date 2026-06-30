'use client'

import Link from 'next/link'
import { FileSpreadsheet, Lock, ShoppingCart, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaxDashboard } from './tax-dashboard'

interface TaxShellProps {
  hasAccess: boolean
  isTrial: boolean
  trialDaysLeft: number
  accessUntil: string | null
}

function formatDate(d: string | null) {
  if (!d) return null
  const t = new Date(d).getTime()
  if (!Number.isFinite(t)) return 'Vĩnh viễn'
  return new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function TaxShell({ hasAccess, isTrial, trialDaysLeft, accessUntil }: TaxShellProps) {
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-16">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 rounded-3xl flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">
          Mô-đun Tờ Khai Thuế
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4 text-sm">
          Thời gian dùng thử đã hết. Mua gói để tiếp tục sử dụng phân tích tờ khai XML.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 mb-8">
          Dữ liệu đã upload được giữ nguyên sau khi mua gói
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/packages">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
              Mua gói Tờ Khai Thuế
            </Button>
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-left">
          {[
            { icon: '📄', title: 'Upload XML tờ khai', desc: 'Hỗ trợ GTGT (01/GTGT), TNDN, TNCN. Nhập nhiều kỳ cùng lúc.' },
            { icon: '📊', title: 'Báo cáo chỉ tiêu', desc: 'Xem theo năm hoặc từng kỳ, pivot dữ liệu tự động.' },
            { icon: '🔍', title: 'Đối soát rủi ro', desc: 'Tự động phát hiện sai lệch ct[43] vs ct[22] và doanh thu GTGT-TNDN.' },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-bold text-sm text-gray-900 dark:text-gray-50 mb-1">{f.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const expiry = formatDate(accessUntil)

  return (
    <div>
      {/* Trial countdown banner */}
      {isTrial && (
        <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border text-sm ${
          trialDaysLeft <= 3
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          {trialDaysLeft <= 3
            ? <AlertCircle className="w-4 h-4 shrink-0" />
            : <Clock className="w-4 h-4 shrink-0" />
          }
          <span className="flex-1">
            <strong>Đang dùng thử</strong> — còn <strong>{trialDaysLeft} ngày</strong>.
            {trialDaysLeft <= 3 && ' Sắp hết hạn!'}
          </span>
          <Link href="/packages">
            <button className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold whitespace-nowrap">
              Mua gói ngay
            </button>
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-50">Tờ Khai Thuế</h1>
          {!isTrial && expiry && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Quyền truy cập đến: {expiry}</p>
          )}
        </div>
      </div>
      <TaxDashboard />
    </div>
  )
}
