'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { getEffectivePrice, type PromotionWithTemplates } from '@/lib/supabase/types'
import type { Template } from '@/lib/supabase/types'
import { ShoppingCart, Eye, CheckCircle2 } from 'lucide-react'
import { CountdownCard } from '@/components/ui/countdown-timer'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateCardProps {
  template: Template
  onViewDetail?: (template: Template) => void
  isPurchased?: boolean
  activePromotions?: PromotionWithTemplates[]
}

export function TemplateCard({ template, onViewDetail, isPurchased, activePromotions = [] }: TemplateCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = cartItems.some((i) => i.id === template.id)

  const discount = template.original_price && template.sale_price && template.original_price > template.sale_price
    ? Math.round((1 - template.sale_price / template.original_price) * 100)
    : null

  const effectivePrice = template.sale_price
    ? getEffectivePrice(template.sale_price, template.id, activePromotions)
    : null
  const promoDiscount = template.sale_price && effectivePrice !== null && effectivePrice < template.sale_price
    ? Math.round((1 - effectivePrice / template.sale_price) * 100)
    : null
  // Find the matching active promo for countdown
  const activePromo = activePromotions.find(p =>
    p.apply_to === 'all' || p.template_ids.includes(template.id)
  )

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    const added = addItem({
      type: 'template',
      id: template.id,
      name: template.name,
      sale_price: template.sale_price ?? 0,
      original_price: template.original_price,
      thumbnail_url: template.thumbnail_url,
    })
    if (added) toast.success('Đã thêm vào giỏ hàng')
    else toast.info('Đã có trong giỏ hàng')
  }

  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/40 hover:shadow-xl dark:hover:shadow-black/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => onViewDetail?.(template)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-800">
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt={template.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <span className="text-gray-300 dark:text-gray-600 text-5xl">📊</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isPurchased && (
            <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <CheckCircle2 className="w-3 h-3" /> Đã mua
            </span>
          )}
          {(promoDiscount || discount) && !isPurchased && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              -{promoDiscount ?? discount}%
            </span>
          )}
        </div>

        {template.category && (
          <div className="absolute top-3 right-3">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              {template.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-black dark:group-hover:text-white">
          {template.name}
        </h3>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs py-0 px-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-normal rounded-full">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs py-0 px-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-normal rounded-full">
                +{template.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-gray-900 dark:text-gray-50 text-base">
              {effectivePrice !== null ? formatCurrency(effectivePrice) : 'Liên hệ'}
            </span>
            {(promoDiscount || (template.original_price && template.original_price > (template.sale_price ?? 0))) && (
              <span className="text-gray-400 dark:text-gray-500 text-xs line-through">
                {formatCurrency(promoDiscount ? template.sale_price! : template.original_price!)}
              </span>
            )}
          </div>

          {isPurchased ? (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail?.(template) }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> Xem
            </button>
          ) : (
            <button
              onClick={inCart ? undefined : handleAddToCart}
              disabled={inCart}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all
                ${inCart
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm'
                }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {inCart ? 'Trong giỏ' : 'Thêm giỏ'}
            </button>
          )}
        </div>
        {activePromo && !isPurchased && <CountdownCard endAt={activePromo.end_at} />}
      </div>
    </div>
  )
}
