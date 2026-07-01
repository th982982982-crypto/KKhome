'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { ShoppingCart, Check, Star } from 'lucide-react'
import type { TaxPlan } from '@/lib/supabase/types'

const FEATURES = [
  'Upload XML tờ khai GTGT, TNDN, TNCN',
  'Bảng chỉ tiêu theo kỳ và theo năm',
  'Đối soát rủi ro số dư và doanh thu',
  'Export Excel báo cáo tổng hợp',
]

export function TaxPlanCard({ plan, hasAccess = false, isRecommended = false }: {
  plan: TaxPlan
  hasAccess?: boolean
  isRecommended?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === plan.id)

  const discount = plan.original_price && plan.original_price > plan.price
    ? Math.round((1 - plan.price / plan.original_price) * 100)
    : 0

  function handleAddToCart() {
    const added = addItem({
      type: 'tax_plan',
      id: plan.id,
      name: plan.name,
      sale_price: plan.price,
      original_price: plan.original_price ?? null,
      thumbnail_url: null,
      duration_months: plan.duration_months,
    })
    if (added) toast.success(`Đã thêm "${plan.name}" vào giỏ hàng`)
    else toast.info('Gói này đã có trong giỏ hàng')
  }

  return (
    <div className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 ${
      isRecommended
        ? 'bg-amber-500 dark:bg-amber-600 text-white ring-4 ring-amber-300 dark:ring-amber-500 shadow-xl shadow-amber-200/50 dark:shadow-amber-900/50 scale-[1.02]'
        : 'bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800'
    }`}>
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-amber-900 text-amber-100 text-xs font-black px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
            <Star className="w-3 h-3 fill-amber-100" /> PHỔ BIẾN NHẤT
          </span>
        </div>
      )}

      {/* Discount badge */}
      {discount > 0 && (
        <span className={`absolute top-4 right-4 text-xs font-black px-2 py-0.5 rounded-full ${
          isRecommended ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
        }`}>
          -{discount}%
        </span>
      )}

      {/* Duration */}
      <div className={`text-sm font-bold mb-1 ${isRecommended ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
        {plan.duration_months === 1 ? '1 tháng' : plan.duration_months === 12 ? '1 năm' : `${plan.duration_months} tháng`}
      </div>

      {/* Name */}
      <h3 className={`text-lg font-black mb-4 ${isRecommended ? 'text-white' : 'text-gray-900 dark:text-gray-50'}`}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black ${isRecommended ? 'text-white' : 'text-gray-900 dark:text-gray-50'}`}>
            {formatCurrency(plan.price)}
          </span>
          {plan.original_price && plan.original_price > plan.price && (
            <span className={`text-sm line-through ${isRecommended ? 'text-amber-200' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatCurrency(plan.original_price)}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isRecommended ? 'text-amber-100' : 'text-amber-500 dark:text-amber-400'}`} />
            <span className={isRecommended ? 'text-amber-50' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {hasAccess ? (
        <div className={`text-center text-sm font-semibold py-2.5 rounded-xl ${isRecommended ? 'bg-white/15 text-white' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'}`}>
          ✓ Đang sử dụng — <button onClick={inCart ? undefined : handleAddToCart} disabled={inCart} className="underline">{inCart ? 'Đã thêm' : 'Gia hạn'}</button>
        </div>
      ) : (
        <Button
          onClick={inCart ? undefined : handleAddToCart}
          disabled={inCart}
          className={`w-full h-11 rounded-xl font-bold ${
            isRecommended
              ? 'bg-white text-amber-700 hover:bg-amber-50 shadow-sm'
              : inCart
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
        </Button>
      )}
    </div>
  )
}
