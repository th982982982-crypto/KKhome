'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Template } from '@/lib/supabase/types'
import type { PromotionWithTemplates } from '@/lib/supabase/types'
import { TemplateCard } from './template-card'
import { TemplateModal } from './template-modal'
import { Search, X, LayoutGrid, ChevronDown } from 'lucide-react'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'newest'

interface TemplateExplorerProps {
  templates: Template[]
  categories: string[]
  purchasedIds?: string[]
  activePromotions?: PromotionWithTemplates[]
}

const PRICE_RANGES: Array<{ key: string; label: string; min: number; max: number }> = [
  { key: 'all', label: 'Tất cả giá', min: 0, max: Infinity },
  { key: 'under-100', label: 'Dưới 100k', min: 0, max: 100_000 },
  { key: '100-300', label: '100k–300k', min: 100_000, max: 300_000 },
  { key: '300-500', label: '300k–500k', min: 300_000, max: 500_000 },
  { key: 'over-500', label: 'Trên 500k', min: 500_000, max: Infinity },
]

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'default', label: 'Mặc định' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price-asc', label: 'Giá: Thấp → Cao' },
  { key: 'price-desc', label: 'Giá: Cao → Thấp' },
]

export function TemplateExplorer({ templates, categories, purchasedIds = [], activePromotions = [] }: TemplateExplorerProps) {
  const [selected, setSelected] = useState<Template | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('default')
  const [priceKey, setPriceKey] = useState<string>('all')
  const [, startTransition] = useTransition()

  const priceRange = PRICE_RANGES.find((p) => p.key === priceKey) ?? PRICE_RANGES[0]

  const filtered = useMemo(() => {
    let list = templates
    if (category) list = list.filter((t) => t.category === category)
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    }
    if (priceRange.key !== 'all') {
      list = list.filter((t) => {
        const p = t.sale_price ?? 0
        return p >= priceRange.min && p <= priceRange.max
      })
    }
    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => (a.sale_price ?? 0) - (b.sale_price ?? 0))
    else if (sort === 'price-desc') sorted.sort((a, b) => (b.sale_price ?? 0) - (a.sale_price ?? 0))
    else if (sort === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sorted
  }, [templates, category, query, sort, priceRange])

  function setFilter(fn: () => void) { startTransition(fn) }
  function clearAll() {
    setFilter(() => { setQuery(''); setCategory(''); setSort('default'); setPriceKey('all') })
  }

  const activeFilterCount = (query ? 1 : 0) + (category ? 1 : 0) + (sort !== 'default' ? 1 : 0) + (priceKey !== 'all' ? 1 : 0)

  return (
    <div>
      {/* Top controls: search + sort + price */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mô tả, tag..."
            value={query}
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
          {query && (
            <button onClick={() => setFilter(() => setQuery(''))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Price dropdown */}
        <div className="relative">
          <select
            value={priceKey}
            onChange={(e) => setFilter(() => setPriceKey(e.target.value))}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
          >
            {PRICE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setFilter(() => setSort(e.target.value as SortKey))}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <p className="ml-auto text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          <span className="font-bold text-gray-900 dark:text-gray-50">{filtered.length}</span> kết quả
        </p>
      </div>

      {/* Category pill filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setFilter(() => setCategory(''))}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
            !category
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          Tất cả
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${!category ? 'bg-white/20 dark:bg-black/20 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            {templates.length}
          </span>
        </button>
        {categories.map((cat) => {
          const count = templates.filter((t) => t.category === cat).length
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => setFilter(() => setCategory(active ? '' : cat))}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {cat}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X className="w-3 h-3" /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isPurchased={purchasedIds.includes(t.id)}
              onViewDetail={setSelected}
              activePromotions={activePromotions}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
            <LayoutGrid className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-50 mb-1">Không tìm thấy template phù hợp</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm</p>
          <button onClick={clearAll} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      <TemplateModal
        template={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        isPurchased={selected ? purchasedIds.includes(selected.id) : false}
        activePromotions={activePromotions}
      />
    </div>
  )
}
