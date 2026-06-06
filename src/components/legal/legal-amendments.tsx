'use client'

import { useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import amendments from '@/lib/legal/amendments.json'

interface Amendment {
  id: string
  updatedAt: string
  effectiveDate: string
  summary: string
  original:  { slug: string; title: string; anchor: string | null }
  amendment: { slug: string; title: string; anchor: string | null }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DocLink({ slug, title, anchor }: { slug: string; title: string; anchor: string | null }) {
  const href = `/legal/${slug}` + (anchor ? `?anchor=${anchor}` : '')
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
    >
      {title}
    </a>
  )
}

const PREVIEW = 4

export function LegalAmendments() {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...(amendments as Amendment[])].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  )
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW)
  const hasMore = sorted.length > PREVIEW

  return (
    <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Lịch sử sửa đổi văn bản</span>
          <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            {sorted.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            {expanded ? 'Thu gọn' : `Xem tất cả`}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-950/50 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
        <span>Văn bản sửa đổi</span>
        <span>Hiệu lực</span>
        <span>Cập nhật</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {visible.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              'grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 px-4 py-3 items-center',
              'hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors'
            )}
          >
            {/* Doc chain */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <DocLink {...item.original} />
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-none" />
              <DocLink {...item.amendment} />
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">
                — {item.summary}
              </span>
            </div>

            {/* Effective date */}
            <span className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
              <span className="sm:hidden text-gray-400 mr-1">Hiệu lực:</span>
              {fmt(item.effectiveDate)}
            </span>

            {/* Updated at */}
            <span className="text-xs text-gray-400 dark:text-gray-500 sm:text-right">
              <span className="sm:hidden text-gray-400 mr-1">Cập nhật:</span>
              {fmt(item.updatedAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
