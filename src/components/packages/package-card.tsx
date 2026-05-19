'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'
import { ShoppingCart, Check } from 'lucide-react'
import type { Package } from '@/lib/supabase/types'

interface PackageWithTemplates extends Package {
  package_templates?: {
    template_id: string
    templates: { id: string; name: string; category: string | null } | null
  }[]
}

export function PackageCard({ package: pkg }: { package: PackageWithTemplates }) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === pkg.id)

  const features = Array.isArray(pkg.features) ? pkg.features as string[] : []
  const templateNames = pkg.package_templates
    ?.map((pt) => pt.templates?.name)
    .filter(Boolean) as string[] ?? []

  function handleAddToCart() {
    addItem({
      type: 'package',
      id: pkg.id,
      name: pkg.name,
      sale_price: pkg.sale_price,
      original_price: pkg.original_price,
      thumbnail_url: null,
    })
    toast.success('Đã thêm gói vào giỏ hàng')
  }

  const discount = pkg.original_price && pkg.original_price > pkg.sale_price
    ? Math.round((1 - pkg.sale_price / pkg.original_price) * 100)
    : 0

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-black transition-colors duration-200 flex flex-col">
      {discount > 0 && (
        <Badge className="self-start mb-3 bg-red-500 text-white">Tiết kiệm {discount}%</Badge>
      )}

      <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>

      {pkg.description && (
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{pkg.description}</p>
      )}

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{formatCurrency(pkg.sale_price)}</span>
          {pkg.original_price && pkg.original_price > pkg.sale_price && (
            <span className="text-gray-400 line-through text-sm">{formatCurrency(pkg.original_price)}</span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>{feature}</span>
          </div>
        ))}

        {templateNames.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
              Bao gồm {templateNames.length} templates:
            </p>
            <div className="space-y-1">
              {templateNames.slice(0, 5).map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span> {name}
                </div>
              ))}
              {templateNames.length > 5 && (
                <p className="text-xs text-gray-400 mt-1">+{templateNames.length - 5} templates khác</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Button
        className="w-full bg-black text-white hover:bg-gray-800 h-11 rounded-xl font-semibold"
        onClick={inCart ? undefined : handleAddToCart}
        disabled={inCart}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {inCart ? 'Đã có trong giỏ hàng' : 'Thêm vào giỏ hàng'}
      </Button>
    </div>
  )
}
