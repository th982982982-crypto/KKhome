'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { NewsPost } from '@/lib/supabase/types'
import { PostCard } from '@/components/news/post-card'
import { Search, X, List, LayoutGrid, Newspaper, Sparkles } from 'lucide-react'

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tin_tuc', label: 'Tin tức' },
  { key: 'quang_cao', label: 'Quảng cáo' },
]

interface NewsExplorerProps {
  posts: NewsPost[]
  initialType?: string
}

export function NewsExplorer({ posts, initialType = 'all' }: NewsExplorerProps) {
  const [selectedType, setSelectedType] = useState<string>(initialType)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list') // Mặc định là 'list'

  const categories = useMemo(() => {
    return Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]))
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts

    if (selectedType !== 'all') {
      list = list.filter((p) => p.post_type === selectedType)
    }

    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory)
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt ?? '').toLowerCase().includes(q) ||
          (p.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      )
    }

    return list
  }, [posts, selectedType, selectedCategory, query])

  return (
    <div className="space-y-6">
      {/* Top Filter & View Mode Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                selectedType === t.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết, chủ đề, tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher (List vs Grid) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Xem dạng danh sách"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Xem dạng lưới"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Lưới</span>
          </button>
        </div>
      </div>

      {/* Categories Filter Pills (if any exist) */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              !selectedCategory
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-gray-300'
            }`}
          >
            Tất cả danh mục ({posts.length})
          </button>
          {categories.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length
            const isCatActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isCatActive ? '' : cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isCatActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-300'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          Hiển thị <strong className="text-gray-900 dark:text-gray-100">{filtered.length}</strong> bài viết
          {viewMode === 'list' ? ' (dạng danh sách)' : ' (dạng lưới)'}
        </span>
      </div>

      {/* Articles Content Display */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <Newspaper className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Không tìm thấy bài viết phù hợp</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Thử thay đổi từ khóa hoặc bộ lọc danh mục</p>
          {(query || selectedCategory || selectedType !== 'all') && (
            <button
              onClick={() => {
                setQuery('')
                setSelectedCategory('')
                setSelectedType('all')
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* DẠNG DANH SÁCH (LIST VIEW) */
        <div className="space-y-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} variant="list" />
          ))}
        </div>
      ) : (
        /* DẠNG LƯỚI (GRID VIEW) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>
      )}
    </div>
  )
}
