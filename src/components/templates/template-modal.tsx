'use client'

import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/format'
import type { Template } from '@/lib/supabase/types'
import { ShoppingCart, X, Tag, PlayCircle, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateModalProps {
  template: Template | null
  open: boolean
  onClose: () => void
  isPurchased?: boolean
}

export function TemplateModal({ template, open, onClose, isPurchased = false }: TemplateModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = template ? cartItems.some((i) => i.id === template.id) : false

  if (!template) return null

  function handleAddToCart() {
    if (!template) return
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

  const videoEmbedUrl = template.tutorial_video_url
    ? getYouTubeEmbedUrl(template.tutorial_video_url)
    : null

  const discount = template.original_price && template.sale_price && template.original_price > template.sale_price
    ? Math.round((1 - template.sale_price / template.original_price) * 100)
    : null

  const benefits = [
    'Quyền truy cập trực tiếp trên web',
    'Video hướng dẫn chi tiết từng bước',
    'Cập nhật miễn phí khi có thay đổi',
    'Hỗ trợ qua chat khi cần',
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto lg:overflow-hidden">
          {/* Left — Image */}
          <div className="lg:w-[55%] relative bg-gradient-to-br from-slate-900 to-slate-950 flex-shrink-0">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px]">
              {template.thumbnail_url ? (
                <Image
                  src={template.thumbnail_url}
                  alt={template.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-slate-800 to-slate-950">📊</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute top-4 left-4 flex gap-2">
                {isPurchased ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                  </span>
                ) : discount ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    -{discount}%
                  </span>
                ) : null}
              </div>

              {template.category && (
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                    {template.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right — Info */}
          <div className="lg:w-[45%] flex flex-col overflow-y-auto pb-24 lg:pb-0">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 leading-tight pr-6 tracking-tight">{template.name}</h2>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full font-normal">
                      <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price + CTA (desktop only — mobile uses sticky bar) */}
            <div className="p-6 pb-4 hidden lg:block">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-gray-900">
                  {template.sale_price ? formatCurrency(template.sale_price) : 'Liên hệ'}
                </span>
                {template.original_price && template.original_price > (template.sale_price ?? 0) && (
                  <span className="text-gray-400 line-through text-base">{formatCurrency(template.original_price)}</span>
                )}
              </div>

              {isPurchased && template.google_sheet_copy_url ? (
                <a
                  href={template.google_sheet_copy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                >
                  <ExternalLink className="w-4 h-4" /> Mở template ngay
                </a>
              ) : (
                <button
                  onClick={inCart ? undefined : handleAddToCart}
                  disabled={inCart}
                  className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl font-semibold text-sm transition-all active:scale-95
                    ${inCart
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20'
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {inCart ? 'Đã có trong giỏ hàng' : 'Thêm vào giỏ hàng'}
                </button>
              )}

              {!isPurchased && template.google_sheet_copy_url && (
                <a
                  href={template.google_sheet_copy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem trước template
                </a>
              )}
            </div>

            {/* What you get */}
            <div className="px-6 pb-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 p-4">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Bạn sẽ nhận được
                </p>
                <ul className="space-y-1.5">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div className="px-6 pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mô tả sản phẩm</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{template.description}</p>
              </div>
            )}

            {/* Video */}
            {videoEmbedUrl && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Video hướng dẫn</p>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={videoEmbedUrl} title="Video hướng dẫn" className="w-full h-full" allowFullScreen />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-100 p-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 leading-tight">
              {template.sale_price ? formatCurrency(template.sale_price) : 'Liên hệ'}
            </span>
            {template.original_price && template.original_price > (template.sale_price ?? 0) && (
              <span className="text-gray-400 line-through text-xs">{formatCurrency(template.original_price)}</span>
            )}
          </div>
          {isPurchased && template.google_sheet_copy_url ? (
            <a
              href={template.google_sheet_copy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 text-white font-semibold text-sm active:scale-95"
            >
              <ExternalLink className="w-4 h-4" /> Mở template
            </a>
          ) : (
            <button
              onClick={inCart ? undefined : handleAddToCart}
              disabled={inCart}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm active:scale-95 transition-all
                ${inCart ? 'bg-gray-100 text-gray-400' : 'bg-black text-white shadow-lg shadow-black/20'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {inCart ? 'Trong giỏ' : 'Thêm giỏ'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
