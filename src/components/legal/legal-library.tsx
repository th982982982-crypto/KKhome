'use client'

import { useMemo, useState } from 'react'
import {
  Scale, Search, X, FileText, CalendarDays, Library,
  BookOpen, Building2, Receipt, User, Wine, Ship, Landmark, Globe, Store, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_META, CATEGORY_ORDER, DOCTYPE_ORDER, computeStats, groupByCategory,
  type CatalogDoc, type DocType,
} from '@/lib/legal/catalog'
import { LegalDocCard } from './legal-doc-card'

const CATEGORY_ICON: Record<string, LucideIcon> = {
  'Chế độ kế toán': BookOpen,
  'Thuế TNDN': Building2,
  'Thuế GTGT': Receipt,
  'Thuế TNCN': User,
  'Thuế TTĐB': Wine,
  'Thuế XNK': Ship,
  'Quản lý thuế': Landmark,
  'Thuế Nhà thầu (FCT)': Globe,
  'HKD, CNKD': Store,
  'Khác': FileText,
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function LegalLibrary({ catalog }: { catalog: CatalogDoc[] }) {
  const [query, setQuery] = useState('')
  const [docType, setDocType] = useState<DocType | null>(null)
  const [category, setCategory] = useState<string | null>(null)

  const stats = useMemo(() => computeStats(catalog), [catalog])

  const allCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => catalog.some((d) => d.categories.includes(c))),
    [catalog]
  )

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = catalog.filter((d) => {
      if (docType && d.docType !== docType) return false
      if (q && !(`${d.shortTitle} ${d.title} ${d.description}`.toLowerCase().includes(q))) return false
      return true
    })
    const grouped = groupByCategory(filtered)
    return category ? grouped.filter((g) => g.category === category) : grouped
  }, [catalog, query, docType, category])

  const resultCount = useMemo(() => {
    const seen = new Set<string>()
    groups.forEach((g) => g.docs.forEach((d) => seen.add(d.slug)))
    return seen.size
  }, [groups])

  const hasFilter = !!query || !!docType || !!category
  const clearAll = () => { setQuery(''); setDocType(null); setCategory(null) }

  const statCards = [
    { label: 'Tổng văn bản', value: `${stats.available}/${stats.total}`, icon: Library, gradient: 'from-indigo-100 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Luật', value: stats.byDocType['Luật'] ?? 0, icon: Scale, gradient: 'from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Nghị định', value: stats.byDocType['Nghị định'] ?? 0, icon: Landmark, gradient: 'from-sky-100 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/30', iconColor: 'text-sky-600 dark:text-sky-400' },
    { label: 'Thông tư', value: stats.byDocType['Thông tư'] ?? 0, icon: BookOpen, gradient: 'from-violet-100 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    { label: 'Có biểu mẫu', value: stats.withForms, icon: FileText, gradient: 'from-pink-100 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/30', iconColor: 'text-pink-600 dark:text-pink-400' },
    { label: 'Mới nhất', value: formatDate(stats.latestEffectiveDate), icon: CalendarDays, gradient: 'from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
          <Scale className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wide">Thư viện pháp luật</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          Pháp luật Thuế &amp; Kế toán
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
          Tra cứu toàn bộ Luật, Nghị định, Thông tư về thuế và chế độ kế toán — sắp xếp theo chủ đề,
          có tham chiếu chéo cấp điều khoản giữa các văn bản.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2.5', s.gradient)}>
                <Icon className={cn('w-5 h-5', s.iconColor)} />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Search + filters */}
      <div className="sticky top-16 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-6 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc nội dung văn bản…"
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Xóa tìm kiếm">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mr-1">Loại:</span>
          {DOCTYPE_ORDER.map((t) => {
            const n = stats.byDocType[t] ?? 0
            if (n === 0) return null
            const active = docType === t
            return (
              <button
                key={t}
                onClick={() => setDocType(active ? null : t)}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
                )}
              >
                {t} <span className={cn('ml-0.5', active ? 'text-blue-100' : 'text-gray-400')}>{n}</span>
              </button>
            )
          })}
          {hasFilter && (
            <button onClick={clearAll} className="text-xs font-semibold px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Xóa lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mr-1">Chủ đề:</span>
          {allCategories.map((c) => {
            const active = category === c
            return (
              <button
                key={c}
                onClick={() => setCategory(active ? null : c)}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                  active
                    ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                )}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Result count when filtering */}
      {hasFilter && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tìm thấy <span className="font-bold text-gray-900 dark:text-gray-50">{resultCount}</span> văn bản
          {category && <> trong <span className="font-semibold">{category}</span></>}
        </p>
      )}

      {/* Sections by category */}
      {groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-bold text-gray-900 dark:text-gray-50">Không tìm thấy văn bản phù hợp</p>
          <button onClick={clearAll} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Xóa bộ lọc</button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const meta = CATEGORY_META[g.category]
            const Icon = CATEGORY_ICON[g.category] ?? FileText
            return (
              <section key={g.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', meta?.gradient)}>
                    <Icon className={cn('w-5 h-5', meta?.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                      {g.category}
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">{g.docs.length}</span>
                    </h2>
                    {meta?.desc && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{meta.desc}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {g.docs.map((d) => (
                    <LegalDocCard key={d.slug} doc={d} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
