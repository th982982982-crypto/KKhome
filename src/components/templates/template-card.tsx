'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import type { Template } from '@/lib/supabase/types'
import { ShoppingCart, Eye } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateCardProps {
  template: Template
  onViewDetail?: (template: Template) => void
  isPurchased?: boolean
}

export function TemplateCard({ template, onViewDetail, isPurchased }: TemplateCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === template.id)

  function handleAddToCart() {
    addItem({
      type: 'template',
      id: template.id,
      name: template.name,
      sale_price: template.sale_price ?? 0,
      original_price: template.original_price,
      thumbnail_url: template.thumbnail_url,
    })
    toast.success('Đã thêm vào giỏ hàng')
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-gray-50 cursor-pointer"
        onClick={() => onViewDetail?.(template)}
      >
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt={template.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-4xl">📊</span>
          </div>
        )}

        {isPurchased && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Đã mua
          </div>
        )}

        {template.original_price && template.sale_price && template.original_price > template.sale_price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            -{Math.round((1 - template.sale_price / template.original_price) * 100)}%
          </div>
        )}
      </div>

      <div className="p-4">
        <h3
          className="font-semibold text-gray-900 text-sm leading-tight mb-1 cursor-pointer hover:text-gray-600 line-clamp-2"
          onClick={() => onViewDetail?.(template)}
        >
          {template.name}
        </h3>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs py-0 px-2">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 text-base">
              {template.sale_price ? formatCurrency(template.sale_price) : 'Liên hệ'}
            </span>
            {template.original_price && template.original_price > (template.sale_price ?? 0) && (
              <span className="text-gray-400 text-xs line-through ml-2">
                {formatCurrency(template.original_price)}
              </span>
            )}
          </div>

          {isPurchased ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={() => onViewDetail?.(template)}
            >
              <Eye className="w-3 h-3 mr-1" />Xem
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs h-8 bg-black text-white hover:bg-gray-800"
              onClick={inCart ? undefined : handleAddToCart}
              disabled={inCart}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              {inCart ? 'Trong giỏ' : 'Thêm giỏ'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
