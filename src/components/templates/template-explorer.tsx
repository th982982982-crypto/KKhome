'use client'

import { useMemo, useState, useTransition } from 'react'
import type { Template } from '@/lib/supabase/types'
import type { PromotionWithTemplates } from '@/lib/supabase/types'
import { TemplateCard } from './template-card'
import { TemplateModal } from './template-modal'
import { Search, ArrowDownUp, X, LayoutGrid, SlidersHorizontal, Tag, DollarSign, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'newest'

interface TemplateExplorerProps {
  templates: Template[]
  categories: string[]
  purchasedIds?: string[]
  activePromotions?: PromotionWithTemplates[]
}

const PRICE_RANGES: Array<{ key: string; label: string; min: number; max: number }> = [
  { key: 'all', label: 'Tất cả mức giá', min: 0, max: Infinity },
  { key: 'under-100', label: 'Dưới 100.000 đ', min: 0, max: 100_000 },
  { key: '100-300', label: '100.000 - 300.000 đ', min: 100_000, max: 300_000 },
  { key: '300-500', label: '300.000 - 500.000 đ', min: 300_000, max: 500_000 },
  { key: 'over-500', label: 'Trên 500.000 đ', min: 500_000, max: Infinity },
]

export function TemplateExplorer({ templates, categories, purchasedIds = [], activePromotions = [] }: TemplateExplorerProps) {
  const [selected, setSelected] = useState<Template | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('default')
  const [priceKey, setPriceKey] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
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

  function setFilter(fn: () => void) {
    startTransition(fn)
  }

  function clearAll() {
    setFilter(() => {
      setQuery('')
      setCategory('')
      setSort('default')
      setPriceKey('all')
    })
  }

  const activeFilterCount =
    (query ? 1 : 0) + (category ? 1 : 0) + (sort !== 'default' ? 1 : 0) + (priceKey !== 'all' ? 1 : 0)

  const sidebar = (
    <div className="space-y-6">
      {/* Search inside sidebar (mobile drawer only) */}
      <div className="lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm template..."
            value={query}
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900"
          />
          {query && (
            <button
              onClick={() => setFilter(() => setQuery(''))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Xóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
          <Tag className="w-3.5 h-3.5 text-indigo-500" /> Danh mục
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setFilter(() => setCategory(''))}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                !category ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
              }`}
            >
              <span>Tất cả</span>
              <span className={`text-xs ${!category ? 'text-white/70 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>{templates.length}</span>
            </button>
          </li>
          {categories.map((cat) => {
            const count = templates.filter((t) => t.category === cat).length
            const active = category === cat
            return (
              <li key={cat}>
                <button
                  onClick={() => setFilter(() => setCategory(active ? '' : cat))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                    active ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className={`text-xs ml-2 shrink-0 ${active ? 'text-white/70 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'}`}>{count}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Khoảng giá
        </h3>
        <ul className="space-y-1">
          {PRICE_RANGES.map((range) => (
            <li key={range.key}>
              <button
                onClick={() => setFilter(() => setPriceKey(range.key))}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  priceKey === range.key
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-1 ring-indigo-200 dark:ring-indigo-800'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                }`}
              >
                {range.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Sort */}
      <div>
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
          <ArrowDownUp className="w-3.5 h-3.5 text-amber-500" /> Sắp xếp
        </h3>
        <ul className="space-y-1">
          {([
            { key: 'default', label: 'Mặc định' },
            { key: 'newest', label: 'Mới nhất' },
            { key: 'price-asc', label: 'Giá: Thấp → Cao' },
            { key: 'price-desc', label: 'Giá: Cao → Thấp' },
          ] as Array<{ key: SortKey; label: string }>).map((opt) => (
            <li key={opt.key}>
              <label className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                sort === opt.key ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-200 dark:ring-amber-800' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
                <input
                  type="radio"
                  name="sort"
                  checked={sort === opt.key}
                  onChange={() => setFilter(() => setSort(opt.key))}
                  className="w-3.5 h-3.5 accent-amber-500"
                />
                {opt.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-3 py-2 rounded-lg transition-colors"
        >
          Xóa tất cả bộ lọc ({activeFilterCount})
        </button>
      )}
    </div>
  )

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-thin">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/40 p-5">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
              <SlidersHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Bộ lọc</h2>
              {activeFilterCount > 0 && (
                <span className="ml-auto text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {sidebar}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        {/* Top bar: search (desktop) + mobile filter button + results */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search desktop */}
          <div className="hidden lg:block relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm template theo tên, mô tả, tag..."
              value={query}
              onChange={(e) => setFilter(() => setQuery(e.target.value))}
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
            {query && (
              <button
                onClick={() => setFilter(() => setQuery(''))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile filter trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-200 active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>

          <p className="ml-auto text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <span className="font-bold text-gray-900 dark:text-gray-50">{filtered.length}</span> kết quả
          </p>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {query && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">
                Từ khóa: <span className="font-semibold">"{query}"</span>
                <button onClick={() => setFilter(() => setQuery(''))} className="hover:text-red-600 dark:hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">
                {category}
                <button onClick={() => setFilter(() => setCategory(''))} className="hover:text-red-600 dark:hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceKey !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">
                {priceRange.label}
                <button onClick={() => setFilter(() => setPriceKey('all'))} className="hover:text-red-600 dark:hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sort !== 'default' && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">
                {sort === 'newest' ? 'Mới nhất' : sort === 'price-asc' ? 'Giá thấp → cao' : 'Giá cao → thấp'}
                <button onClick={() => setFilter(() => setSort('default'))} className="hover:text-red-600 dark:hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

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
            <button
              onClick={clearAll}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="font-bold text-gray-900 dark:text-gray-50">Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-gray-900 font-semibold flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Xem {filtered.length} kết quả
              </button>
            </div>
          </div>
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
