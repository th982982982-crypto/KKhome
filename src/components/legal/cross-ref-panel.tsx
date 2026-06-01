'use client'

import type { LegalDoc } from '@/lib/legal/registry'
import { X, ArrowRight, FileText } from 'lucide-react'

interface CrossRefPanelProps {
  doc: LegalDoc
  allDocs: LegalDoc[]
  onNavigate: (slug: string, anchor?: string) => void
  onClose: () => void
}

export function CrossRefPanel({ doc, allDocs, onNavigate, onClose }: CrossRefPanelProps) {
  return (
    <aside className="w-80 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-50">Tham chiếu chéo</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Từ <span className="font-semibold text-gray-700 dark:text-gray-300">{doc.shortTitle}</span> — nội dung liên quan:
        </p>

        {doc.crossRefs.map((ref, i) => {
          const target = allDocs.find((d) => d.slug === ref.targetSlug)
          if (!target) return null
          return (
            <button
              key={i}
              onClick={() => onNavigate(ref.targetSlug, ref.targetAnchor)}
              className="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
            >
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-50">{ref.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{ref.description}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-semibold flex items-center gap-1">
                    {ref.targetAnchor ? 'Nhảy đến ' : 'Xem '}{target.shortTitle}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
