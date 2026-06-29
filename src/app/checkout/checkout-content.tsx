'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || 'ACB'
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '4465436'
const BANK_OWNER = process.env.NEXT_PUBLIC_BANK_OWNER || 'HO KINH DOANH KKHOME'
const BANK_CODE = process.env.NEXT_PUBLIC_BANK_CODE || 'ACB'
const PAYMENT_WINDOW_SECONDS = 10 * 60
const STORAGE_KEY = 'kkhome_pending_order'

interface PendingOrder {
  orderCode: string
  orderId: string
  orderTotal: number
  email: string
  createdAt: number // timestamp ms
}

function savePendingOrder(data: PendingOrder) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PendingOrder
    // Bỏ qua nếu đã quá 10 phút
    if (Date.now() - data.createdAt > PAYMENT_WINDOW_SECONDS * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function clearPendingOrder() {
  localStorage.removeItem(STORAGE_KEY)
}

function buildVietQrUrl(amount: number, orderCode: string): string {
  const addInfo = encodeURIComponent(orderCode)
  return `https://img.vietqr.io/image/${BANK_CODE}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(BANK_OWNER)}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function CheckoutContent() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [countdown, setCountdown] = useState(PAYMENT_WINDOW_SECONDS)
  const [orderStatus, setOrderStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending')
  const [cancelNote, setCancelNote] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  const hasLegalPlan = items.some((i) => i.type === 'legal_plan' || i.type === 'tax_plan')
  const blockGuestLegal = hasLegalPlan && isLoggedIn === false

  // Restore pending order from localStorage on mount
  useEffect(() => {
    const saved = loadPendingOrder()
    if (saved) {
      setOrderCode(saved.orderCode)
      setOrderId(saved.orderId)
      setOrderTotal(saved.orderTotal)
      setEmail(saved.email)
      const elapsed = Math.floor((Date.now() - saved.createdAt) / 1000)
      setCountdown(Math.max(0, PAYMENT_WINDOW_SECONDS - elapsed))
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      if (user?.email) setEmail((prev) => prev || user.email || '')
    })
  }, [])

  useEffect(() => {
    if (items.length === 0 && !orderCode) {
      const saved = loadPendingOrder()
      if (saved) return // có order đang chờ, không redirect
      const t = setTimeout(() => router.push('/cart'), 200)
      return () => clearTimeout(t)
    }
  }, [items, orderCode, router])

  // Countdown timer
  useEffect(() => {
    if (!orderCode || orderStatus !== 'pending') return
    if (countdown <= 0) return

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [orderCode, orderStatus])

  // Poll order status mỗi 5 giây (bypass RLS — dùng API thay Supabase client trực tiếp)
  useEffect(() => {
    if (!orderId || orderStatus !== 'pending') return

    async function checkStatus() {
      const res = await fetch(`/api/order-status?order_id=${orderId}`).catch(() => null)
      if (!res?.ok) return
      const data = await res.json()
      if (data.status && data.status !== 'pending') {
        setOrderStatus(data.status as 'confirmed' | 'cancelled')
        if (data.cancel_note) setCancelNote(data.cancel_note as string)
        clearPendingOrder()
      }
    }

    // Kiểm tra ngay lập tức
    checkStatus()

    // Poll mỗi 5 giây
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [orderId, orderStatus])

  async function handleCreateOrder() {
    if (!items.length) return

    if (blockGuestLegal) {
      toast.error('Vui lòng đăng nhập để mua gói Pháp luật')
      return
    }

    setEmailTouched(true)
    if (!isValidEmail(email)) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ')
      return
    }

    setLoading(true)
    const submitTotal = total()
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ type: i.type, id: i.id, name: i.name, price: i.sale_price, duration_months: i.duration_months })),
        total: submitTotal,
        note,
        email,
      }),
    })

    const data = await res.json()
    if (data.order_code) {
      setOrderCode(data.order_code)
      setOrderId(data.order_id)
      setOrderTotal(submitTotal)
      setCountdown(PAYMENT_WINDOW_SECONDS)
      setOrderStatus('pending')
      savePendingOrder({
        orderCode: data.order_code,
        orderId: data.order_id,
        orderTotal: submitTotal,
        email,
        createdAt: Date.now(),
      })
      clearCart()
    } else {
      toast.error(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  function handleCreateNew() {
    clearPendingOrder()
    router.push('/cart')
  }

  if (orderCode) {
    const qrUrl = buildVietQrUrl(orderTotal, orderCode)
    const isExpired = countdown === 0 && orderStatus === 'pending'

    // Payment confirmed
    if (orderStatus === 'confirmed') {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-emerald-900/60 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">Thanh toán thành công!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Chúng tôi đã chia sẻ templates về email <strong>{email}</strong> của bạn ở chế độ xem.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Kiểm tra Google Drive — file đã được chia sẻ với bạn.</p>
          <Button
            className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl px-8"
            onClick={() => router.push('/dashboard')}
          >
            Xem đơn hàng của tôi <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )
    }

    // Order cancelled
    if (orderStatus === 'cancelled') {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">Đơn hàng đã bị hủy</h2>
          {cancelNote && (
            <p className="text-gray-600 dark:text-gray-300 mb-2">Lý do: <span className="font-medium">{cancelNote}</span></p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Vui lòng liên hệ admin nếu có thắc mắc.</p>
          <Button
            className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl px-8"
            onClick={handleCreateNew}
          >
            Tạo đơn mới
          </Button>
        </div>
      )
    }

    // QR expired
    if (isExpired) {
      return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">Mã QR đã hết hiệu lực</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Đã quá 10 phút kể từ khi tạo đơn <strong>{orderCode}</strong>.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Nếu bạn đã chuyển khoản, vui lòng liên hệ admin để xác nhận thủ công.</p>
          <Button
            className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl px-8"
            onClick={handleCreateNew}
          >
            Tạo đơn mới
          </Button>
        </div>
      )
    }

    // Active payment window
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/40 p-8 text-center border-b border-green-100 dark:border-emerald-800">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-emerald-900/60 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">Đơn hàng đã tạo thành công!</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Chuyển khoản theo thông tin bên dưới — hệ thống sẽ tự xác nhận khi nhận được tiền.</p>

            {/* Countdown */}
            <div className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full font-mono font-bold text-xl ${countdown < 120 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200'}`}>
              <Clock className="w-5 h-5" />
              {formatCountdown(countdown)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Mã QR còn hiệu lực trong {formatCountdown(countdown)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-4">
                <Image
                  src={qrUrl}
                  alt="VietQR code"
                  width={280}
                  height={280}
                  className="rounded-2xl"
                  unoptimized
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Quét mã QR bằng app ngân hàng của bạn</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Ngân hàng', value: BANK_NAME },
                { label: 'Số tài khoản', value: BANK_ACCOUNT, copy: true },
                { label: 'Chủ tài khoản', value: BANK_OWNER },
                { label: 'Số tiền', value: formatCurrency(orderTotal), copy: true, highlight: true },
                { label: 'Nội dung CK', value: orderCode, copy: true, highlight: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{row.label}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-sm font-semibold truncate ${row.highlight ? 'text-blue-600 dark:text-blue-400 text-base' : 'text-gray-900 dark:text-gray-100'}`}>
                      {row.value}
                    </span>
                    {row.copy && (
                      <button
                        onClick={() => copyToClipboard(row.value, row.label)}
                        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 transition-colors"
                        aria-label={`Copy ${row.label}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200 mt-2">
                ⚠️ Nội dung CK phải đúng <strong>{orderCode}</strong> để được xác nhận tự động.
              </div>

              <Button
                className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl mt-3"
                onClick={() => router.push('/dashboard')}
              >
                Xem đơn hàng của tôi <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Đơn hàng ({items.length} sản phẩm)
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 overflow-hidden shrink-0">
                    {item.thumbnail_url ? (
                      <Image src={item.thumbnail_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📊</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.type === 'package' ? 'Gói bundle' : item.type === 'legal_plan' ? `Gói Pháp luật${item.duration_months ? ` · ${item.duration_months} tháng` : ''}` : item.type === 'tax_plan' ? `Gói Tờ Khai Thuế${item.duration_months ? ` · ${item.duration_months} tháng` : ''}` : 'Template lẻ'}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-50 shrink-0">{formatCurrency(item.sale_price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email nhận hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={emailTouched && !isValidEmail(email) ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {emailTouched && !isValidEmail(email) && (
                <p className="text-xs text-red-500">Vui lòng nhập email hợp lệ</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">Template Drive sẽ được chia sẻ về email này sau khi xác nhận thanh toán.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Ghi chú (không bắt buộc)</Label>
              <Input
                id="note"
                placeholder="Ví dụ: Cần hỗ trợ cài đặt thêm..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-0.5">Thanh toán tự động</p>
              <p className="text-blue-800/80 dark:text-blue-300/80">Hệ thống tự nhận diện thanh toán và chia sẻ templates ngay lập tức sau khi nhận được tiền.</p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Tổng cộng</h2>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-baseline">
              <span className="text-gray-500 dark:text-gray-400">Số tiền cần trả</span>
              <span className="text-2xl font-black text-gray-900 dark:text-gray-50">{formatCurrency(total())}</span>
            </div>
            {blockGuestLegal && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
                Gói Pháp luật gắn quyền theo tài khoản. Vui lòng{' '}
                <Link href="/login?redirect=/checkout" className="underline font-semibold">đăng nhập</Link>{' '}
                trước khi thanh toán.
              </div>
            )}
            <Button
              className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-12 rounded-xl font-semibold text-base"
              onClick={handleCreateOrder}
              disabled={loading || items.length === 0 || blockGuestLegal}
            >
              {loading ? 'Đang tạo đơn...' : 'Tạo đơn & xem thông tin CK'}
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Bạn sẽ nhận được mã đơn hàng và mã QR thanh toán ở bước tiếp theo
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
