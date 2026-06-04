'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronRight, ArrowLeft, Library, Menu, X, Clock, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOCTYPE_BADGE, groupByCategory, type CatalogDoc } from '@/lib/legal/catalog'

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface LegalShellProps {
  catalog: CatalogDoc[]
  currentSlug: string
  rightHeaderSlot?: React.ReactNode
  children: React.ReactNode
}

export function LegalShell({ catalog, currentSlug, rightHeaderSlot, children }: LegalShellProps) {
  const router = useRouter()
  const groups = useMemo(() => groupByCategory(catalog), [catalog])
  const current = catalog.find((d) => d.slug === currentSlug)
  const currentCategory = current?.categories[0]

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.docs.some((d) => d.slug === currentSlug)).map((g) => g.category))
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggle = (cat: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  const go = (slug: string) => {
    setMobileNavOpen(false)
    router.push(`/legal/${slug}`)
  }

  const SidebarNav = (
    <nav className="p-3 space-y-1">
      <Link
        href="/legal"
        className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Library className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Thư viện pháp luật
      </Link>
      {groups.map((g) => {
        const open = expanded.has(g.category)
        const hasCurrent = g.docs.some((d) => d.slug === currentSlug)
        return (
          <div key={g.category}>
            <button
              onClick={() => toggle(g.category)}
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors',
                hasCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              )}
            >
              {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate text-left flex-1">{g.category}</span>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-1.5 py-0.5">{g.docs.length}</span>
            </button>
            {open && (
              <div className="ml-2.5 pl-2.5 border-l border-gray-200 dark:border-gray-800 space-y-0.5 py-1">
                {g.docs.map((d) => {
                  const active = d.slug === currentSlug
                  const isSoon = d.status === 'coming-soon'
                  if (isSoon) {
                    return (
                      <div key={d.slug} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{d.shortTitle}</span>
                      </div>
                    )
                  }
                  return (
                    <button
                      key={d.slug}
                      onClick={() => go(d.slug)}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors truncate',
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {d.shortTitle}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto scrollbar-thin">
        {SidebarNav}
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-950 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-gray-50">Danh mục</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
            {SidebarNav}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Breadcrumb + metadata band */}
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 sm:px-4 py-2.5 flex items-center gap-3">
          <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Mở danh mục">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/legal" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0">
            <ArrowLeft className="w-4 h-4" /> Thư viện
          </Link>

          <nav className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
            {currentCategory && (
              <>
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:inline">{currentCategory}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 hidden md:inline shrink-0" />
              </>
            )}
            {current && (
              <span className="font-bold text-gray-900 dark:text-gray-50 truncate">{current.shortTitle}</span>
            )}
          </nav>

          {current && (
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full', DOCTYPE_BADGE[current.docType])}>
                {current.docType}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <CalendarDays className="w-3.5 h-3.5" /> {formatDate(current.effectiveDate)}
              </span>
              {rightHeaderSlot}
            </div>
          )}
        </div>

        {/* Content (iframe + cross-ref panel) */}
        <div className="flex flex-1 min-h-0">{children}</div>
      </div>
    </div>
  )
}
