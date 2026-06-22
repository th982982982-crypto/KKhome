'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CountdownCard } from '@/components/ui/countdown-timer'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { ShoppingCart, ScrollText } from 'lucide-react'
import { getLegalPlanEffectivePrice, isLegalPlanPromoActive } from '@/lib/supabase/types'
import type { LegalPlan } from '@/lib/supabase/types'

export function LegalPlanCard({ plan, hasAccess = false }: { plan: LegalPlan; hasAccess?: boolean }) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === plan.id)

  const effectivePrice = getLegalPlanEffectivePrice(plan)
  const promoActive = isLegalPlanPromoActive(plan)
  // Giá gạch: khi đang KM gạch giá thường; ngược lại gạch original_price (nếu có)
  const strikePrice = promoActive ? plan.price : plan.original_price
  const discount = strikePrice && strikePrice > effectivePrice
    ? Math.round((1 - effectivePrice / strikePrice) * 100)
    : 0

  function handleAddToCart() {
    const added = addItem({
      type: 'legal_plan',
      id: plan.id,
      name: plan.name,
      sale_price: effectivePrice,
      original_price: strikePrice ?? plan.price,
      thumbnail_url: null,
      duration_months: plan.duration_months,
    })
    if (added) toast.success('Đã thêm gói vào giỏ hàng')
    else toast.info('Đã có trong giỏ hàng')
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:border-black dark:hover:border-white transition-colors duration-200 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300">
          <ScrollText className="w-5 h-5" />
        </span>
        {discount > 0 && <Badge className="bg-red-500 text-white">Tiết kiệm {discount}%</Badge>}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">{plan.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Truy cập toàn bộ thư viện Pháp luật trong <strong>{plan.duration_months} tháng</strong>
      </p>

      <div className="mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">{formatCurrency(effectivePrice)}</span>
          {strikePrice && strikePrice > effectivePrice && (
            <span className="text-gray-400 dark:text-gray-500 line-through text-sm">{formatCurrency(strikePrice)}</span>
          )}
        </div>
      </div>

      {promoActive && plan.promo_end_at && <CountdownCard endAt={plan.promo_end_at} />}

      <div className="flex-1" />

      <Button
        className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl font-semibold mt-6"
        onClick={inCart ? undefined : handleAddToCart}
        disabled={inCart}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {inCart ? 'Đã có trong giỏ hàng' : hasAccess ? 'Gia hạn' : 'Thêm vào giỏ hàng'}
      </Button>
    </div>
  )
}
