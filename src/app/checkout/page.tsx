'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (items.length === 0 && !orderCode) {
      router.push('/cart')
    }
  }, [items, orderCode, router])

  async function handleCreateOrder() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?redirect=/checkout')
      return
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ type: i.type, id: i.id, name: i.name, price: i.sale_price })),
        total: total(),
        note,
      }),
    })

    const data = await res.json()
    if (data.order_code) {
      setOrderCode(data.order_code)
      clearCart()
    } else {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    }
    setLoading(false)
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  if (orderCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đơn hàng đã tạo!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Vui lòng chuyển khoản theo thông tin bên dưới. Sau khi admin xác nhận, bạn sẽ nhận được quyền truy cập.
            </p>

            <div className="bg-gray-50 rounded-xl p-5 text-left space-y-4 mb-6">
              {[
                { label: 'Ngân hàng', value: process.env.NEXT_PUBLIC_BANK_NAME || 'Vietcombank' },
                { label: 'Số tài khoản', value: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '1234567890', copy: true },
                { label: 'Chủ tài khoản', value: process.env.NEXT_PUBLIC_BANK_OWNER || 'NGUYEN THI NGAN' },
                { label: 'Số tiền', value: `Xem trong đơn hàng` },
                { label: 'Nội dung CK', value: orderCode, copy: true, highlight: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 shrink-0">{row.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${row.highlight ? 'text-blue-600 text-base' : 'text-gray-900'}`}>
                      {row.value}
                    </span>
                    {row.copy && (
                      <button
                        onClick={() => copyToClipboard(row.value, row.label)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-4">
              ⚠️ Nội dung chuyển khoản phải đúng mã đơn hàng <strong>{orderCode}</strong> để được xác nhận nhanh.
            </p>

            <Button
              className="w-full bg-black text-white hover:bg-gray-800 h-11 rounded-xl"
              onClick={() => router.push('/dashboard')}
            >
              Xem đơn hàng của tôi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Đơn hàng ({items.length} sản phẩm)</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate mr-4">{item.name}</span>
                <span className="font-medium shrink-0">{formatCurrency(item.sale_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold">
            <span>Tổng cộng</span>
            <span className="text-lg">{formatCurrency(total())}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="space-y-1.5">
            <Label>Ghi chú (không bắt buộc)</Label>
            <Input
              placeholder="Ghi chú thêm cho đơn hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl font-semibold text-base"
          onClick={handleCreateOrder}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Tạo đơn hàng & xem thông tin CK'}
        </Button>
      </div>
    </div>
  )
}
