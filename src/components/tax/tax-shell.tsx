'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileSpreadsheet, ShoppingCart, Clock, AlertCircle, FlaskConical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaxDashboard } from './tax-dashboard'
import { toast } from 'sonner'

interface TaxShellProps {
  hasAccess: boolean
  isTrial: boolean
  trialDaysLeft: number
  accessUntil: string | null
  trialExpired: boolean
  canStartTrial?: boolean
  trialDays?: number
  isLoggedIn?: boolean
}

function formatDate(d: string | null) {
  if (!d) return null
  const t = new Date(d).getTime()
  if (!Number.isFinite(t)) return 'Vĩnh viễn'
  return new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function TaxShell({ hasAccess, isTrial, trialDaysLeft, accessUntil, trialExpired, canStartTrial = false, trialDays = 14, isLoggedIn = true }: TaxShellProps) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  async function handleStartTrial() {
    setStarting(true)
    try {
      const res = await fetch('/api/tax/start-trial', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Lỗi khi bắt đầu dùng thử')
      toast.success(`Đã kích hoạt ${trialDays} ngày dùng thử!`)
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
      setStarting(false)
    }
  }

  // Chưa bắt đầu trial và không có subscription → hiện intro
  if (!hasAccess && !trialExpired) {
    const features = [
      { icon: '📄', color: 'bg-blue-50 dark:bg-blue-950/40', title: 'Upload XML tờ khai', desc: 'Hỗ trợ GTGT (01/GTGT), TNDN, TNCN. Nhập nhiều kỳ cùng lúc.' },
      { icon: '📊', color: 'bg-amber-50 dark:bg-amber-950/40', title: 'Báo cáo chỉ tiêu', desc: 'Xem theo năm hoặc từng kỳ, pivot dữ liệu tự động.' },
      { icon: '🔍', color: 'bg-green-50 dark:bg-green-950/40', title: 'Đối soát rủi ro', desc: 'Phát hiện sai lệch ct[43] vs ct[22] và doanh thu GTGT–TNDN.' },
      { icon: '📥', color: 'bg-purple-50 dark:bg-purple-950/40', title: 'Export Excel', desc: 'Xuất báo cáo tổng hợp sang Excel với một click.' },
    ]

    return (
      <div className="-mx-4 -mt-8">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-16 text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 ring-1 ring-white/30">
              🧾 Mô-đun Tờ Khai Thuế
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight tracking-tight">
              Phân tích tờ khai XML<br />nhanh &amp; chính xác
            </h1>
            <p className="text-amber-100 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Upload XML từ phần mềm thuế, xem bảng chỉ tiêu theo kỳ/năm, tự động đối soát rủi ro và xuất báo cáo Excel.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {!isLoggedIn ? (
                <>
                  <Link href="/login">
                    <Button className="h-11 px-6 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-lg shadow-amber-900/20 gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Đăng nhập dùng thử miễn phí
                    </Button>
                  </Link>
                  <Link href="/packages#tax">
                    <Button className="h-11 px-6 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Xem bảng giá
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {canStartTrial && (
                    <Button
                      onClick={handleStartTrial}
                      disabled={starting}
                      className="h-11 px-6 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-lg shadow-amber-900/20 gap-2"
                    >
                      {starting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Đang kích hoạt...</>
                        : <><FlaskConical className="w-4 h-4" />Dùng thử {trialDays} ngày miễn phí</>
                      }
                    </Button>
                  )}
                  <Link href="/packages#tax">
                    <Button className={`h-11 px-6 rounded-xl font-bold gap-2 ${canStartTrial ? 'bg-white/15 hover:bg-white/25 text-white border border-white/30' : 'bg-white text-amber-700 hover:bg-amber-50 shadow-lg shadow-amber-900/20'}`}>
                      <ShoppingCart className="w-4 h-4" />
                      {canStartTrial ? 'Xem bảng giá' : 'Mua gói Tờ Khai Thuế'}
                    </Button>
                  </Link>
                  {!canStartTrial && (
                    <p className="w-full text-xs text-amber-200 mt-1">Bạn đã dùng hết lượt thử miễn phí.</p>
                  )}
                </>
              )}
            </div>

            {!isLoggedIn && (
              <p className="mt-4 text-xs text-amber-200">Dùng thử {trialDays} ngày, không cần thẻ tín dụng</p>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">Tính năng nổi bật</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md dark:hover:shadow-black/40 transition-shadow">
                <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{f.icon}</div>
                <div className="font-bold text-sm text-gray-900 dark:text-gray-50 mb-1">{f.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const expiry = formatDate(accessUntil)

  return (
    <div>
      {/* Trial hết hạn — read-only banner */}
      {trialExpired && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            <strong>Thời gian dùng thử đã hết.</strong> Dữ liệu được giữ nguyên — mua gói để tiếp tục upload và phân tích.
          </span>
          <Link href="/packages">
            <button className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold whitespace-nowrap">
              Mua gói ngay
            </button>
          </Link>
        </div>
      )}

      {/* Trial đang hoạt động — countdown banner */}
      {isTrial && !trialExpired && (
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
      <TaxDashboard isReadOnly={trialExpired} />
    </div>
  )
}
