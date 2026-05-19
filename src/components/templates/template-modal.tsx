'use client'

import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/format'
import type { Template } from '@/lib/supabase/types'
import { ShoppingCart, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateModalProps {
  template: Template | null
  open: boolean
  onClose: () => void
}

export function TemplateModal({ template, open, onClose }: TemplateModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = template ? cartItems.some((i) => i.id === template.id) : false

  if (!template) return null

  function handleAddToCart() {
    if (!template) return
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

  const videoEmbedUrl = template.tutorial_video_url
    ? getYouTubeEmbedUrl(template.tutorial_video_url)
    : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-lg font-bold leading-tight pr-8">{template.name}</DialogTitle>
          </DialogHeader>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Image */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {template.thumbnail_url ? (
                  <Image src={template.thumbnail_url} alt={template.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">📊</div>
                )}
              </div>

              {template.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-2">
                    <span>📄</span> Mô tả sản phẩm
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{template.description}</p>
                </div>
              )}

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-medium uppercase tracking-wide">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Price + Action */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Giá bán</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {template.sale_price ? formatCurrency(template.sale_price) : 'Liên hệ'}
                  </span>
                  {template.original_price && template.original_price > (template.sale_price ?? 0) && (
                    <span className="text-gray-400 line-through text-sm">
                      {formatCurrency(template.original_price)}
                    </span>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-black text-white hover:bg-gray-800 h-12 text-sm font-semibold rounded-xl"
                onClick={inCart ? undefined : handleAddToCart}
                disabled={inCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {inCart ? 'Đã có trong giỏ hàng' : 'Thêm vào giỏ hàng'}
              </Button>

              {videoEmbedUrl && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-semibold mb-2">
                    <span>▶️</span> Video hướng dẫn
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={videoEmbedUrl}
                      title="Video hướng dẫn"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
