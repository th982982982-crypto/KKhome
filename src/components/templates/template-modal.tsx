'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getYouTubeEmbedUrl } from '@/lib/format'
import { getEffectivePrice, type PromotionWithTemplates } from '@/lib/supabase/types'
import type { Template } from '@/lib/supabase/types'
import {
  ShoppingCart,
  X,
  Tag,
  PlayCircle,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Video,
  ImageIcon
} from 'lucide-react'
import { CountdownModal } from '@/components/ui/countdown-timer'
import { useCartStore } from '@/lib/cart-store'
import { toast } from 'sonner'

interface TemplateModalProps {
  template: Template | null
  open: boolean
  onClose: () => void
  isPurchased?: boolean
  activePromotions?: PromotionWithTemplates[]
}

export function TemplateModal({
  template,
  open,
  onClose,
  isPurchased = false,
  activePromotions = []
}: TemplateModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = template ? cartItems.some((i) => i.id === template.id) : false
  const [activeIdx, setActiveIdx] = useState(0)
  const [mediaView, setMediaView] = useState<'both' | 'video' | 'images'>('both')

  const images: string[] = template
    ? [template.thumbnail_url, ...(template.gallery_urls ?? [])].filter((u): u is string => !!u)
    : []

  const videoEmbedUrl = template?.tutorial_video_url
    ? getYouTubeEmbedUrl(template.tutorial_video_url)
    : null

  useEffect(() => {
    if (open) {
      setActiveIdx(0)
      setMediaView('both')
    }
  }, [open, template?.id])

  if (!template) return null

  function handleAddToCart() {
    if (!template) return
    const added = addItem({
      type: 'template',
      id: template.id,
      name: template.name,
      sale_price: effectivePrice ?? template.sale_price ?? 0,
      original_price: promoDiscount ? template.sale_price : template.original_price,
      thumbnail_url: template.thumbnail_url,
    })
    if (added) toast.success('Đã thêm vào giỏ hàng')
    else toast.info('Đã có trong giỏ hàng')
  }

  function next() {
    if (images.length === 0) return
    setActiveIdx((i) => (i + 1) % images.length)
  }

  function prev() {
    if (images.length === 0) return
    setActiveIdx((i) => (i - 1 + images.length) % images.length)
  }

  const discount =
    template.original_price && template.sale_price && template.original_price > template.sale_price
      ? Math.round((1 - template.sale_price / template.original_price) * 100)
      : null

  const effectivePrice = template.sale_price
    ? getEffectivePrice(template.sale_price, template.id, activePromotions)
    : null

  const promoDiscount =
    template.sale_price && effectivePrice !== null && effectivePrice < template.sale_price
      ? Math.round((1 - effectivePrice / template.sale_price) * 100)
      : null

  const activePromo = activePromotions.find(
    (p) => p.apply_to === 'all' || p.template_ids.includes(template.id)
  )

  const benefits = [
    'Quyền truy cập trực tiếp trên web',
    'Video hướng dẫn chi tiết từng bước',
    'Cập nhật miễn phí khi có thay đổi',
    'Hỗ trợ qua chat khi cần',
  ]

  const currentImage = images[activeIdx]
  const hasBothMedia = Boolean(videoEmbedUrl && images.length > 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-6xl xl:max-w-7xl max-h-[92vh] p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl bg-white dark:bg-gray-900 flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-20">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {template.category && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  <FileSpreadsheet className="w-3 h-3 text-indigo-500" />
                  {template.category}
                </span>
              )}
              {isPurchased ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
                </span>
              ) : (promoDiscount || discount) ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  -{promoDiscount ?? discount}%
                </span>
              ) : null}
              {template.tags && template.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <Tag className="w-2.5 h-2.5 text-gray-400" />
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-gray-50 leading-tight truncate">
              {template.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {/* ========================================================= */}
          {/* PHẦN TRÊN: HIỂN THỊ VIDEO VÀ HÌNH ẢNH SẢN PHẨM           */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-950/60">
            {/* View switcher when both video and images exist */}
            {hasBothMedia && (
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" /> Media & Trải nghiệm sản phẩm
                </span>
                <div className="inline-flex p-1 rounded-xl bg-gray-200/70 dark:bg-gray-800/80 text-xs font-semibold">
                  <button
                    onClick={() => setMediaView('both')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      mediaView === 'both'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Xem cả Video & Ảnh
                  </button>
                  <button
                    onClick={() => setMediaView('video')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                      mediaView === 'video'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-red-500" /> Chỉ xem Video
                  </button>
                  <button
                    onClick={() => setMediaView('images')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                      mediaView === 'images'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Chỉ xem Ảnh ({images.length})
                  </button>
                </div>
              </div>
            )}

            {/* CASE 1: BOTH MEDIA (Default side-by-side or stacked on mobile) */}
            {hasBothMedia && mediaView === 'both' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* Left: Video */}
                <div className="flex flex-col bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
                      <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                        <PlayCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <span>Video hướng dẫn chi tiết</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Full HD</span>
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-gray-100 dark:border-gray-800 flex-1 min-h-[220px]">
                    <iframe
                      src={videoEmbedUrl!}
                      title="Video hướng dẫn"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Right: Images Carousel */}
                <div className="flex flex-col bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span>Hình ảnh giao diện mẫu</span>
                    </div>
                    {images.length > 1 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {activeIdx + 1} / {images.length}
                      </span>
                    )}
                  </div>

                  {/* Main image viewer */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-gray-100 dark:border-gray-800 flex items-center justify-center group flex-1 min-h-[220px]">
                    {currentImage ? (
                      <Image
                        key={currentImage}
                        src={currentImage}
                        alt={`${template.name} ${activeIdx + 1}`}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="text-5xl">📊</div>
                    )}

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prev}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                          aria-label="Ảnh trước"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                        <button
                          onClick={next}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                          aria-label="Ảnh sau"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails row */}
                  {images.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-thin py-1">
                      {images.map((url, i) => (
                        <button
                          key={url}
                          onClick={() => setActiveIdx(i)}
                          className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            i === activeIdx
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-105'
                              : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                          }`}
                          aria-label={`Ảnh ${i + 1}`}
                        >
                          <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CASE 2: ONLY VIDEO or USER SELECTED VIDEO ONLY */}
            {videoEmbedUrl && (!hasBothMedia || mediaView === 'video') && (
              <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                      <PlayCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <span>Video hướng dẫn & trải nghiệm chi tiết</span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Chất lượng Full HD</span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-gray-100 dark:border-gray-800">
                  <iframe
                    src={videoEmbedUrl}
                    title="Video hướng dẫn"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* CASE 3: ONLY IMAGES or USER SELECTED IMAGES ONLY */}
            {images.length > 0 && (!hasBothMedia || mediaView === 'images') && (
              <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span>Bộ sưu tập hình ảnh mẫu</span>
                  </div>
                  {images.length > 1 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {activeIdx + 1} / {images.length}
                    </span>
                  )}
                </div>

                <div className="relative aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-gray-100 dark:border-gray-800 flex items-center justify-center group">
                  {currentImage ? (
                    <Image
                      key={currentImage}
                      src={currentImage}
                      alt={`${template.name} ${activeIdx + 1}`}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 1200px) 100vw, 900px"
                      priority
                    />
                  ) : (
                    <div className="text-6xl">📊</div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition"
                        aria-label="Ảnh sau"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-thin py-1">
                    {images.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => setActiveIdx(i)}
                        className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          i === activeIdx
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-105'
                            : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                        }`}
                        aria-label={`Ảnh ${i + 1}`}
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PHẦN BÊN DƯỚI: THÔNG TIN VỀ GIÁ, MÔ TẢ SẢN PHẨM          */}
          {/* ========================================================= */}
          <div className="p-6 sm:p-8 bg-white dark:bg-gray-900 pb-28 lg:pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* CỘT TRÁI: GIÁ & MUA HÀNG & LỢI ÍCH */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                {/* Khối giá và nút mua hàng */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      Giá sở hữu trọn đời
                    </span>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
                        {effectivePrice !== null ? formatCurrency(effectivePrice) : 'Liên hệ'}
                      </span>
                      {(promoDiscount || (template.original_price && template.original_price > (template.sale_price ?? 0))) && (
                        <span className="text-gray-400 dark:text-gray-500 line-through text-lg font-semibold">
                          {formatCurrency(promoDiscount ? template.sale_price! : template.original_price!)}
                        </span>
                      )}
                      {(promoDiscount || discount) && !isPurchased && (
                        <span className="bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                          -{promoDiscount ?? discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  {activePromo && !isPurchased && <CountdownModal endAt={activePromo.end_at} />}

                  {/* Nút hành động (Desktop) */}
                  <div className="space-y-2.5 pt-2 hidden lg:block">
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
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> Xem trước template (Google Sheet)
                      </a>
                    )}
                  </div>
                </div>

                {/* Khối Bạn sẽ nhận được */}
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/60 p-5 space-y-3">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Bạn sẽ nhận được
                  </p>
                  <ul className="space-y-2">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CỘT PHẢI: MÔ TẢ CHI TIẾT SẢN PHẨM */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Mô tả sản phẩm
                  </h3>
                </div>

                {/* Đính kèm Video / Clip trực tiếp trong phần Mô tả sản phẩm */}
                {videoEmbedUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md">
                    <div className="px-4 py-2.5 bg-slate-800/90 dark:bg-slate-900/90 border-b border-slate-700/60 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center shadow-sm">
                          <PlayCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span>Video / Clip giới thiệu & hướng dẫn chi tiết</span>
                      </div>
                      <span className="text-[11px] text-gray-300 font-medium">Full HD</span>
                    </div>
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={videoEmbedUrl}
                        title="Video hướng dẫn sản phẩm"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {template.description ? (
                  /<[a-z][\s\S]*>/i.test(template.description) ? (
                    <div
                      className="text-base text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base dark:prose-invert max-w-none break-words [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-3 [&_video]:w-full [&_video]:aspect-video [&_video]:rounded-xl [&_video]:my-3"
                      dangerouslySetInnerHTML={{ __html: template.description }}
                    />
                  ) : (
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {template.description}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-gray-400 italic">Chưa có thông tin mô tả chi tiết cho sản phẩm này.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA Bar */}
        <div className="lg:hidden shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-3.5 flex items-center gap-3 z-30">
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-black text-gray-900 dark:text-gray-50 leading-tight truncate">
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
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 text-white font-semibold text-sm active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <ExternalLink className="w-4 h-4" /> Mở template
            </a>
          ) : (
            <button
              onClick={inCart ? undefined : handleAddToCart}
              disabled={inCart}
              className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm active:scale-95 transition-all
                ${inCart ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-md shadow-black/20'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {inCart ? 'Trong giỏ' : 'Thêm giỏ'}
            </button>
          )}
          {!isPurchased && template.google_sheet_copy_url && (
            <a
              href={template.google_sheet_copy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 h-11 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold"
              title="Xem trước"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
