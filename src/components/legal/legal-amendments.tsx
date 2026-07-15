'use client'

import { useState } from 'react'
import { ArrowRight, ChevronDown, RefreshCw } from 'lucide-react'
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
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm whitespace-nowrap"
    >
      {title}
    </a>
  )
}

export function LegalAmendments() {
  const [open, setOpen] = useState(false)
  const sorted = [...(amendments as Amendment[])].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  )

  return (
    <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-blue-500 flex-none" />
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Lịch sử sửa đổi văn bản</span>
        <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
          {sorted.length}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 flex-none ml-auto transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <>
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-950/50 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
            <span>Văn bản sửa đổi</span>
            <span>Hiệu lực</span>
            <span>Cập nhật</span>
          </div>

          {/* Scrollable rows — chiều cao cố định ~4 dòng, scroll khi nhiều hơn */}
          <div className="overflow-y-auto max-h-[224px] divide-y divide-gray-50 dark:divide-gray-800/60">
            {sorted.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 px-4 py-3 items-center',
                  'hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors'
                )}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <DocLink {...item.original} />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-none" />
                  <DocLink {...item.amendment} />
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">
                    — {item.summary}
                  </span>
                </div>

                <span className="text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                  <span className="sm:hidden text-gray-400 mr-1">Hiệu lực:</span>
                  {fmt(item.effectiveDate)}
                </span>

                <span className="text-xs text-gray-400 dark:text-gray-500 sm:text-right">
                  <span className="sm:hidden text-gray-400 mr-1">Cập nhật:</span>
                  {fmt(item.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
