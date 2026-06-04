'use client'

import Link from 'next/link'
import { CalendarDays, FileText, Link2, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOCTYPE_BADGE, type CatalogDoc } from '@/lib/legal/catalog'

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function LegalDocCard({ doc }: { doc: CatalogDoc }) {
  const isComingSoon = doc.status === 'coming-soon'

  const inner = (
    <div
      className={cn(
        'group h-full flex flex-col rounded-2xl border bg-white dark:bg-gray-900 p-5 transition-all',
        isComingSoon
          ? 'border-dashed border-gray-200 dark:border-gray-800 opacity-70'
          : 'border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', DOCTYPE_BADGE[doc.docType])}>
          {doc.docType}
        </span>
        {doc.hasForms && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
            <FileText className="w-3 h-3" /> Có biểu mẫu
          </span>
        )}
        {isComingSoon && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Sắp cập nhật
          </span>
        )}
      </div>

      <h3 className={cn('font-bold text-gray-900 dark:text-gray-50 leading-snug', !isComingSoon && 'group-hover:text-blue-700 dark:group-hover:text-blue-400')}>
        {doc.shortTitle}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-3 flex-1">
        {doc.description}
      </p>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> {formatDate(doc.effectiveDate)}
        </span>
        {doc.crossRefsCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5" /> {doc.crossRefsCount} liên kết
          </span>
        )}
        {!isComingSoon && (
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Mở <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>
    </div>
  )

  if (isComingSoon) {
    return <div className="cursor-not-allowed select-none">{inner}</div>
  }

  return (
    <Link href={`/legal/${doc.slug}`} className="block h-full">
      {inner}
    </Link>
  )
}
