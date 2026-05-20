'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

export function CartContent() {
  const { items, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <ShoppingBag className="w-9 h-9 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h1>
          <p className="text-gray-500 mb-8">Khám phá kho templates để tìm sản phẩm phù hợp với bạn</p>
          <Link href="/templates">
            <Button className="bg-black text-white hover:bg-gray-800 h-11 px-6 rounded-xl">
              Khám phá templates <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = total()
  const originalSum = items.reduce((s, i) => s + (i.original_price || i.sale_price), 0)
  const savings = originalSum - subtotal

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Giỏ hàng của bạn</h1>
        <p className="text-gray-500 mt-1">{items.length} sản phẩm trong giỏ</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all hover:border-gray-200 hover:shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden shrink-0">
                {item.thumbnail_url ? (
                  <Image src={item.thumbnail_url} alt={item.name} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📊</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">
                  {item.type === 'package' ? 'Gói bundle' : 'Template lẻ'}
                </span>
              </div>

              <div className="text-right shrink-0 mr-2">
                <p className="font-bold text-gray-900">{formatCurrency(item.sale_price)}</p>
                {item.original_price && item.original_price > item.sale_price && (
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(item.original_price)}</p>
                )}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Xóa khỏi giỏ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="text-gray-900">{formatCurrency(originalSum)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiết kiệm</span>
                  <span className="text-green-600 font-medium">-{formatCurrency(savings)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="text-2xl font-black text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl font-semibold text-base">
                Thanh toán <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <p className="text-xs text-gray-400 text-center">
              Thanh toán qua chuyển khoản ngân hàng. Sau khi admin xác nhận, bạn sẽ truy cập được templates ngay lập tức.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
