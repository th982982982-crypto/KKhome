'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LegalDoc } from '@/lib/legal/registry'
import { CrossRefPanel } from './cross-ref-panel'
import { Scale, CalendarDays } from 'lucide-react'

interface LegalViewerProps {
  currentSlug: string
  allDocs: LegalDoc[]
  anchor?: string
}

export function LegalViewer({ currentSlug, allDocs, anchor }: LegalViewerProps) {
  const router = useRouter()
  const [showCrossRef, setShowCrossRef] = useState(false)

  const currentDoc = allDocs.find((d) => d.slug === currentSlug)!
  const iframeSrc = `/api/legal/${currentSlug}${anchor ? '#' + anchor : ''}`

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center shrink-0 px-2 gap-0">
        <div className="flex items-center gap-0 flex-1 min-w-0 overflow-x-auto">
          {allDocs.map((doc) => (
            <button
              key={doc.slug}
              onClick={() => {
                setShowCrossRef(false)
                router.push(`/legal/${doc.slug}`)
              }}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                doc.slug === currentSlug
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              {doc.shortTitle}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pl-2 pr-1 py-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" />
            Hiệu lực:{' '}
            {new Date(currentDoc.effectiveDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>

          <button
            onClick={() => setShowCrossRef((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              showCrossRef
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tham chiếu chéo</span>
            <span className="inline sm:hidden">Liên kết</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${showCrossRef ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900'}`}>
              {currentDoc.crossRefs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative min-w-0">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="w-full h-full border-0"
            title={currentDoc.title}
            style={{
              backgroundColor: currentDoc.theme === 'dark' ? '#0e1220' : '#f0f4f8',
            }}
            sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-top-navigation-by-user-activation"
          />
        </div>

        {showCrossRef && (
          <CrossRefPanel
            doc={currentDoc}
            allDocs={allDocs}
            onNavigate={(slug, anchor) => {
              const url = anchor ? `/legal/${slug}?anchor=${anchor}` : `/legal/${slug}`
              router.push(url)
              setShowCrossRef(false)
            }}
            onClose={() => setShowCrossRef(false)}
          />
        )}
      </div>
    </div>
  )
}
