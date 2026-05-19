'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Giỏ hàng trống</h1>
          <p className="text-gray-500 mb-6">Hãy thêm template hoặc gói vào giỏ hàng</p>
          <Link href="/templates">
            <Button className="bg-black text-white hover:bg-gray-800">Xem templates</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Giỏ hàng ({items.length})</h1>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {item.thumbnail_url ? (
                  <Image src={item.thumbnail_url} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">📊</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.type === 'package' ? 'Gói bundle' : 'Template lẻ'}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(item.sale_price)}</p>
                {item.original_price && item.original_price > item.sale_price && (
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(item.original_price)}</p>
                )}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Tổng cộng</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(total())}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full bg-black text-white hover:bg-gray-800 h-12 rounded-xl font-semibold text-base">
              Thanh toán <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/templates" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3">
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
    </div>
  )
}
