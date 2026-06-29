'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { ShoppingCart, Receipt, CheckCircle } from 'lucide-react'
import type { TaxPlan } from '@/lib/supabase/types'

export function TaxPlanCard({ plan, hasAccess = false }: { plan: TaxPlan; hasAccess?: boolean }) {
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
    if (added) {
      toast.success(`Đã thêm "${plan.name}" vào giỏ hàng`)
    } else {
      toast.info('Gói này đã có trong giỏ hàng')
    }
  }

  return (
    <div className="relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      {discount > 0 && (
        <div className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          -{discount}%
        </div>
      )}

      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-5">
        <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>

      <h3 className="font-black text-lg text-gray-900 dark:text-gray-50 mb-1">{plan.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Truy cập module Tờ Khai Thuế trong{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-200">{plan.duration_months} tháng</span>
      </p>

      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-black text-gray-900 dark:text-gray-50">{formatCurrency(plan.price)}</span>
          {plan.original_price && plan.original_price > plan.price && (
            <span className="text-sm line-through text-gray-300 dark:text-gray-600">{formatCurrency(plan.original_price)}</span>
          )}
        </div>

        {hasAccess ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" /> Bạn đang có quyền truy cập
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={inCart}
            className={`w-full rounded-xl font-bold ${inCart ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
          </Button>
        )}
      </div>
    </div>
  )
}
