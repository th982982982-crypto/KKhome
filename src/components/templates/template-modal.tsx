'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/format'
import { getEffectivePrice, type PromotionWithTemplates } from '@/lib/supabase/types'
import type { Template } from '@/lib/supabase/types'
import { ShoppingCart, X, Tag, PlayCircle, ExternalLink, CheckCircle2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateModalProps {
  template: Template | null
  open: boolean
  onClose: () => void
  isPurchased?: boolean
  activePromotions?: PromotionWithTemplates[]
}

export function TemplateModal({ template, open, onClose, isPurchased = false, activePromotions = [] }: TemplateModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = template ? cartItems.some((i) => i.id === template.id) : false
  const [activeIdx, setActiveIdx] = useState(0)

  const images: string[] = template
    ? [template.thumbnail_url, ...(template.gallery_urls ?? [])].filter((u): u is string => !!u)
    : []

  useEffect(() => {
    if (open) setActiveIdx(0)
  }, [open, template?.id])

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

  function next() { setActiveIdx((i) => (i + 1) % images.length) }
  function prev() { setActiveIdx((i) => (i - 1 + images.length) % images.length) }

  const videoEmbedUrl = template.tutorial_video_url
    ? getYouTubeEmbedUrl(template.tutorial_video_url)
    : null

  const discount = template.original_price && template.sale_price && template.original_price > template.sale_price
    ? Math.round((1 - template.sale_price / template.original_price) * 100)
    : null

  const effectivePrice = template.sale_price
    ? getEffectivePrice(template.sale_price, template.id, activePromotions)
    : null
  const promoDiscount = template.sale_price && effectivePrice !== null && effectivePrice < template.sale_price
    ? Math.round((1 - effectivePrice / template.sale_price) * 100)
    : null
  const activePromo = activePromotions.find(p =>
    p.apply_to === 'all' || p.template_ids.includes(template.id)
  )

  const benefits = [
    'Quyền truy cập trực tiếp trên web',
    'Video hướng dẫn chi tiết từng bước',
    'Cập nhật miễn phí khi có thay đổi',
    'Hỗ trợ qua chat khi cần',
  ]

  const currentImage = images[activeIdx]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-5xl p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl bg-white dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto lg:overflow-hidden">
          {/* Left — Image carousel */}
          <div className="lg:w-[55%] relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex-shrink-0 flex flex-col">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:flex-1 min-h-[320px] lg:min-h-[480px] flex items-center justify-center overflow-hidden">
              {currentImage ? (
                <Image
                  key={currentImage}
                  src={currentImage}
                  alt={`${template.name} ${activeIdx + 1}`}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              ) : (
                <div className="text-6xl">📊</div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                {isPurchased ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                  </span>
                ) : (promoDiscount || discount) ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                    -{promoDiscount ?? discount}%
                  </span>
                ) : null}
              </div>

              {template.category && (
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="bg-white/80 dark:bg-black/60 backdrop-blur-sm text-gray-800 dark:text-white text-xs font-medium px-3 py-1 rounded-full border border-white/40 dark:border-white/20">
                    {template.category}
                  </span>
                </div>
              )}

              {/* Prev/Next */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </button>
                  <div className="absolute bottom-4 right-4 z-10 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur">
                    {activeIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="px-4 py-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur border-t border-gray-200/70 dark:border-gray-700/70">
                <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                  {images.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setActiveIdx(i)}
                      className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeIdx
                          ? 'border-indigo-500 shadow-md scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      aria-label={`Ảnh ${i + 1}`}
                    >
                      <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="lg:w-[45%] flex flex-col overflow-y-auto pb-24 lg:pb-0 bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-50 leading-tight pr-6 tracking-tight">{template.name}</h2>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full font-normal">
                      <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price + CTA (desktop only — mobile uses sticky bar) */}
            <div className="p-6 pb-4 hidden lg:block">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-black text-gray-900 dark:text-gray-50">
                  {effectivePrice !== null ? formatCurrency(effectivePrice) : 'Liên hệ'}
                </span>
                {(promoDiscount || (template.original_price && template.original_price > (template.sale_price ?? 0))) && (
                  <span className="text-gray-400 dark:text-gray-500 line-through text-base">
                    {formatCurrency(promoDiscount ? template.sale_price! : template.original_price!)}
                  </span>
                )}
              </div>
              {activePromo && !isPurchased && (
                <div className="mb-4">
                  <CountdownTimer endAt={activePromo.end_at} className="text-sm text-red-500 dark:text-red-400 font-semibold" />
                </div>
              )}

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
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg shadow-black/20'
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
                  className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem trước template
                </a>
              )}
            </div>

            {/* What you get */}
            <div className="px-6 pb-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100/50 dark:border-indigo-900/50 p-4">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Bạn sẽ nhận được
                </p>
                <ul className="space-y-1.5">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div className="px-6 pb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Mô tả sản phẩm</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{template.description}</p>
              </div>
            )}

            {/* Video */}
            {videoEmbedUrl && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Video hướng dẫn</p>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={videoEmbedUrl} title="Video hướng dẫn" className="w-full h-full" allowFullScreen />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 dark:text-gray-50 leading-tight">
              {effectivePrice !== null ? formatCurrency(effectivePrice) : 'Liên hệ'}
            </span>
            {(promoDiscount || (template.original_price && template.original_price > (template.sale_price ?? 0))) && (
              <span className="text-gray-400 dark:text-gray-500 line-through text-xs">
                {formatCurrency(promoDiscount ? template.sale_price! : template.original_price!)}
              </span>
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
                ${inCart ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-black/20'}`}
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
