'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LegalDoc } from '@/lib/legal/registry'
import type { CatalogDoc } from '@/lib/legal/catalog'
import { CrossRefPanel } from './cross-ref-panel'
import { LegalShell } from './legal-shell'
import { Scale, Lock } from 'lucide-react'

interface LegalViewerProps {
  currentSlug: string
  allDocs: LegalDoc[]
  catalog: CatalogDoc[]
  anchor?: string
  hasAccess?: boolean
}

export function LegalViewer({ currentSlug, allDocs, catalog, anchor, hasAccess = false }: LegalViewerProps) {
  const router = useRouter()
  const [showCrossRef, setShowCrossRef] = useState(false)

  const currentDoc = allDocs.find((d) => d.slug === currentSlug)!
  const iframeSrc = `/api/legal/${currentSlug}${anchor ? '#' + anchor : ''}`

  const crossRefButton = currentDoc.crossRefs.length > 0 && (
    hasAccess ? (
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
    ) : (
      <button
        disabled
        title="Mua gói Pháp luật để dùng tham chiếu chéo"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none"
      >
        <Lock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tham chiếu chéo</span>
        <span className="inline sm:hidden">Liên kết</span>
        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none bg-gray-200 dark:bg-gray-700">
          {currentDoc.crossRefs.length}
        </span>
      </button>
    )
  )

  return (
    <LegalShell catalog={catalog} currentSlug={currentSlug} rightHeaderSlot={crossRefButton}>
      <div className="flex-1 relative min-w-0">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          className="w-full h-full border-0"
          title={currentDoc.title}
          style={{ backgroundColor: currentDoc.theme === 'dark' ? '#0e1220' : '#f0f4f8' }}
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-top-navigation-by-user-activation"
        />
      </div>

      {showCrossRef && hasAccess && (
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
    </LegalShell>
  )
}
