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
import { Copy, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || 'Vietcombank'
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '1234567890'
const BANK_OWNER = process.env.NEXT_PUBLIC_BANK_OWNER || 'NGUYEN THI NGAN'
const BANK_CODE = process.env.NEXT_PUBLIC_BANK_CODE || 'VCB'

function buildVietQrUrl(amount: number, orderCode: string): string {
  const addInfo = encodeURIComponent(orderCode)
  return `https://img.vietqr.io/image/${BANK_CODE}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(BANK_OWNER)}`
}

export function CheckoutContent() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (items.length === 0 && !orderCode) {
      const t = setTimeout(() => router.push('/cart'), 200)
      return () => clearTimeout(t)
    }
  }, [items, orderCode, router])

  async function handleCreateOrder() {
    if (!items.length) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }

    const submitTotal = total()
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ type: i.type, id: i.id, name: i.name, price: i.sale_price })),
        total: submitTotal,
        note,
      }),
    })

    const data = await res.json()
    if (data.order_code) {
      setOrderCode(data.order_code)
      setOrderTotal(submitTotal)
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

  if (orderCode) {
    const qrUrl = buildVietQrUrl(orderTotal, orderCode)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Đơn hàng đã tạo thành công!</h2>
            <p className="text-gray-600 mt-1">Chuyển khoản theo thông tin bên dưới — bạn sẽ nhận templates sau khi admin xác nhận.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white border-4 border-dashed border-gray-200 rounded-3xl p-4">
                <Image
                  src={qrUrl}
                  alt="VietQR code"
                  width={280}
                  height={280}
                  className="rounded-2xl"
                  unoptimized
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Quét mã QR bằng app ngân hàng của bạn</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Ngân hàng', value: BANK_NAME },
                { label: 'Số tài khoản', value: BANK_ACCOUNT, copy: true },
                { label: 'Chủ tài khoản', value: BANK_OWNER },
                { label: 'Số tiền', value: formatCurrency(orderTotal), copy: true, highlight: true },
                { label: 'Nội dung CK', value: orderCode, copy: true, highlight: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 shrink-0">{row.label}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-sm font-semibold truncate ${row.highlight ? 'text-blue-600 text-base' : 'text-gray-900'}`}>
                      {row.value}
                    </span>
                    {row.copy && (
                      <button
                        onClick={() => copyToClipboard(row.value, row.label)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0 transition-colors"
                        aria-label={`Copy ${row.label}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mt-2">
                ⚠️ Nội dung CK phải đúng <strong>{orderCode}</strong> để được xác nhận tự động.
              </div>

              <Button
                className="w-full bg-black text-white hover:bg-gray-800 h-11 rounded-xl mt-3"
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
        <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Đơn hàng ({items.length} sản phẩm)
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden shrink-0">
                    {item.thumbnail_url ? (
                      <Image src={item.thumbnail_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📊</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type === 'package' ? 'Gói bundle' : 'Template lẻ'}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">{formatCurrency(item.sale_price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
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

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-0.5">Thanh toán an toàn</p>
              <p className="text-blue-800/80">Chuyển khoản ngân hàng, được admin xác nhận trong vòng vài phút trong giờ làm việc.</p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Tổng cộng</h2>
            <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline">
              <span className="text-gray-500">Số tiền cần trả</span>
              <span className="text-2xl font-black text-gray-900">{formatCurrency(total())}</span>
            </div>
            <Button
              className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl font-semibold text-base"
              onClick={handleCreateOrder}
              disabled={loading || items.length === 0}
            >
              {loading ? 'Đang tạo đơn...' : 'Tạo đơn & xem thông tin CK'}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Bạn sẽ nhận được mã đơn hàng và mã QR thanh toán ở bước tiếp theo
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
