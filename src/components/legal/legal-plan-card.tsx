'use client'

import { Button } from '@/components/ui/button'
import { CountdownCard } from '@/components/ui/countdown-timer'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { ShoppingCart, Check, Star } from 'lucide-react'
import { getLegalPlanEffectivePrice, isLegalPlanPromoActive } from '@/lib/supabase/types'
import type { LegalPlan } from '@/lib/supabase/types'

const FEATURES = [
  'Tra cứu toàn bộ văn bản pháp luật',
  'Tham chiếu chéo giữa các điều khoản',
  'Tải biểu mẫu đính kèm văn bản',
  'Đọc tóm tắt từng Điều ngay trên web',
]

export function LegalPlanCard({ plan, hasAccess = false, isRecommended = false }: {
  plan: LegalPlan
  hasAccess?: boolean
  isRecommended?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === plan.id)

  const effectivePrice = getLegalPlanEffectivePrice(plan)
  const promoActive = isLegalPlanPromoActive(plan)
  const strikePrice = promoActive ? plan.price : plan.original_price
  const discount = strikePrice && strikePrice > effectivePrice
    ? Math.round((1 - effectivePrice / strikePrice) * 100)
    : 0

  function handleAddToCart() {
    const durLabel = plan.duration_months === 120 ? 'Vĩnh viễn' : plan.duration_months === 12 ? '1 năm' : `${plan.duration_months} tháng`
    const cartName = `Gói Pháp luật · ${durLabel}`
    const added = addItem({
      type: 'legal_plan',
      id: plan.id,
      name: cartName,
      sale_price: effectivePrice,
      original_price: strikePrice ?? plan.price,
      thumbnail_url: null,
      duration_months: plan.duration_months,
    })
    if (added) toast.success('Đã thêm gói vào giỏ hàng')
    else toast.info('Đã có trong giỏ hàng')
  }

  return (
    <div className={`relative flex flex-col rounded-2xl p-6 transition-all duration-200 ${
      isRecommended
        ? 'bg-indigo-600 dark:bg-indigo-700 text-white ring-4 ring-indigo-300 dark:ring-indigo-500 shadow-xl shadow-indigo-200/50 dark:shadow-indigo-900/50 scale-[1.02]'
        : 'bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'
    }`}>
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
            <Star className="w-3 h-3 fill-amber-900" /> PHỔ BIẾN NHẤT
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
      <div className={`text-sm font-bold mb-1 ${isRecommended ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
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
            {formatCurrency(effectivePrice)}
          </span>
          {strikePrice && strikePrice > effectivePrice && (
            <span className={`text-sm line-through ${isRecommended ? 'text-indigo-300' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatCurrency(strikePrice)}
            </span>
          )}
        </div>
        {promoActive && plan.promo_end_at && (
          <div className="mt-2">
            <CountdownCard endAt={plan.promo_end_at} />
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isRecommended ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}`} />
            <span className={isRecommended ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {hasAccess ? (
        <div className={`text-center text-sm font-semibold py-2.5 rounded-xl ${isRecommended ? 'bg-white/15 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
          ✓ Đang sử dụng — <button onClick={inCart ? undefined : handleAddToCart} disabled={inCart} className="underline">{inCart ? 'Đã thêm' : 'Gia hạn'}</button>
        </div>
      ) : (
        <Button
          className={`w-full h-11 rounded-xl font-bold ${
            isRecommended
              ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm'
              : inCart
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600'
          }`}
          onClick={inCart ? undefined : handleAddToCart}
          disabled={inCart}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
        </Button>
      )}
    </div>
  )
}
