'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getYouTubeEmbedUrl, markdownToHtml } from '@/lib/format'
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
  Video,
  ImageIcon,
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
  activePromotions = [],
}: TemplateModalProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const inCart = template ? cartItems.some((i) => i.id === template.id) : false
  const [activeIdx, setActiveIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images')

  const images: string[] = template
    ? [template.thumbnail_url, ...(template.gallery_urls ?? [])].filter((u): u is string => !!u)
    : []

  const videoEmbedUrl = template?.tutorial_video_url
    ? getYouTubeEmbedUrl(template.tutorial_video_url)
    : null

  useEffect(() => {
    if (open) {
      setActiveIdx(0)
      setActiveTab('images')
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:max-w-[96vw] max-w-[1700px] h-[92vh] max-h-[94vh] p-0 overflow-hidden rounded-2xl gap-0 border-0 shadow-2xl bg-white dark:bg-gray-900 flex flex-col"
        style={{
          width: '96vw',
          maxWidth: '1700px',
          height: '92vh',
          maxHeight: '94vh',
        }}
      >
        {/* Modal Body: 2 Columns on Desktop */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* ========================================================= */}
          {/* CỘT BÊN TRÁI: HÌNH ẢNH SẢN PHẨM / VIDEO HƯỚNG DẪN        */}
          {/* ========================================================= */}
          <div className="lg:w-[56%] xl:w-[58%] 2xl:w-[60%] flex flex-col bg-slate-100 dark:bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 shrink-0 relative overflow-hidden">
            {/* Media Tab Bar (if video exists) */}
            {videoEmbedUrl && (
              <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 backdrop-blur z-10">
                <div className="inline-flex p-1 rounded-xl bg-gray-200/70 dark:bg-gray-800/80 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'images'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Hình ảnh mẫu ({images.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === 'video'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>Video hướng dẫn</span>
                  </button>
                </div>

                {activeTab === 'images' && images.length > 1 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
                    {activeIdx + 1}/{images.length}
                  </span>
                )}
              </div>
            )}

            {/* Main Media Viewer Area */}
            <div className="flex-1 min-h-[300px] sm:min-h-[420px] relative flex items-center justify-center p-3 sm:p-5 overflow-hidden">
              {activeTab === 'video' && videoEmbedUrl ? (
                <div className="w-full h-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800 flex items-center justify-center">
                  <iframe
                    src={videoEmbedUrl}
                    title="Video hướng dẫn"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center group">
                  {currentImage ? (
                    <Image
                      key={currentImage}
                      src={currentImage}
                      alt={`${template.name} ${activeIdx + 1}`}
                      fill
                      className="object-contain p-2 select-none"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      priority
                    />
                  ) : (
                    <div className="text-6xl">📊</div>
                  )}

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-800 dark:text-gray-200"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-800 dark:text-gray-200"
                        aria-label="Ảnh sau"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Single mode badge when no tab bar */}
                  {!videoEmbedUrl && images.length > 1 && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white shadow-md">
                        {activeIdx + 1}/{images.length}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Thumbnails Strip */}
            {images.length > 1 && (
              <div className="shrink-0 px-4 py-3 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                {images.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => {
                      setActiveIdx(i)
                      setActiveTab('images')
                    }}
                    className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeTab === 'images' && i === activeIdx
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-105'
                        : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Ảnh ${i + 1}`}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}

                {videoEmbedUrl && (
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center transition-all bg-red-50 dark:bg-red-950/40 text-red-600 ${
                      activeTab === 'video'
                        ? 'border-red-600 ring-2 ring-red-500/30 shadow-md scale-105'
                        : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
                    }`}
                    title="Xem video hướng dẫn"
                  >
                    <PlayCircle className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-0.5">Video</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* CỘT BÊN PHẢI: THÔNG TIN SẢN PHẨM & MÔ TẢ CHI TIẾT        */}
          {/* ========================================================= */}
          <div className="lg:w-[44%] xl:w-[42%] 2xl:w-[40%] flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-900 relative">
            {/* Header: Title + Close Button */}
            <div className="shrink-0 flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
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
                  {template.tags && template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <Tag className="w-2.5 h-2.5 text-gray-400" />
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-50 leading-snug">
                  {template.name}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content (Price, CTA, Benefits, Description) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {/* Khối giá */}
              <div>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
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

              {/* Nút hành động */}
              <div className="space-y-2.5">
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

              {/* Khối Bạn sẽ nhận được */}
              <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 sm:p-5 space-y-3">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Bạn sẽ nhận được
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

              {/* Khối Mô tả sản phẩm */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Mô tả sản phẩm
                  </h3>
                </div>

                {/* Video đính kèm trong phần mô tả (nếu có) */}
                {videoEmbedUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-sm my-3">
                    <div className="px-3.5 py-2 bg-slate-800/90 dark:bg-slate-900/90 border-b border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <PlayCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Video / Clip hướng dẫn chi tiết</span>
                      </div>
                      <span className="text-[10px] text-gray-300 font-medium">Full HD</span>
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

                {/* Rich Description text */}
                <div
                  className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm sm:prose dark:prose-invert max-w-none break-words [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-indigo-600 [&_h3]:mt-4 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-3 [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(template.description) }}
                />
              </div>
            </div>

            {/* Mobile Sticky Bar */}
            <div className="lg:hidden shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-3.5 flex items-center gap-3 z-30">
              <div className="flex flex-col min-w-0">
                <span className="text-base font-black text-gray-900 dark:text-gray-50 leading-tight truncate">
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
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 text-white font-semibold text-xs active:scale-95 shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở template
                </a>
              ) : (
                <button
                  onClick={inCart ? undefined : handleAddToCart}
                  disabled={inCart}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-semibold text-xs active:scale-95 transition-all
                    ${inCart ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-md shadow-black/20'}`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {inCart ? 'Trong giỏ' : 'Thêm giỏ'}
                </button>
              )}
              {!isPurchased && template.google_sheet_copy_url && (
                <a
                  href={template.google_sheet_copy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold"
                  title="Xem trước"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
