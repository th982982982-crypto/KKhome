'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { TAI_LIEU_ITEMS, type TaiLieuItem } from '@/lib/tai-lieu-data'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  FileText, 
  FileSpreadsheet, 
  FileDown, 
  Search, 
  Bookmark, 
  Eye, 
  Download, 
  X, 
  Check, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nhan_su', label: 'Nhân sự - Lương' },
  { id: 'ke_toan', label: 'Kế toán - Thuế' },
  { id: 'thue', label: 'Pháp lý doanh nghiệp' },
  { id: 'bhxh', label: 'Bảo hiểm Xã hội' },
  { id: 'kpi', label: 'Đánh giá KPI' },
  { id: 'hop_dong', label: 'Hợp đồng & Biểu mẫu' },
]

interface TaiLieuExplorerProps {
  user?: { email?: string | null; id?: string; user_metadata?: { full_name?: string } | null } | null
}

export function TaiLieuExplorer({ user }: TaiLieuExplorerProps = {}) {
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [onlyBookmarks, setOnlyBookmarks] = useState(false)
  const [activeModalItem, setActiveModalItem] = useState<TaiLieuItem | null>(null)
  const [showAllLimit, setShowAllLimit] = useState(false)

  const [currentUser, setCurrentUser] = useState(user ?? null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTargetItem, setAuthTargetItem] = useState<TaiLieuItem | null>(null)

  useEffect(() => {
    setCurrentUser(user ?? null)
  }, [user])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleDownload(item: TaiLieuItem, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!currentUser) {
      setAuthTargetItem(item)
      setShowAuthModal(true)
      return
    }

    toast.success(`Bắt đầu tải xuống: ${item.filename}`)
    const a = document.createElement('a')
    a.href = item.downloadUrl
    a.download = item.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kkhome_bookmarks')
      if (saved) setBookmarks(JSON.parse(saved))
    } catch {}
  }, [])

  function toggleBookmark(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try {
        localStorage.setItem('kkhome_bookmarks', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return TAI_LIEU_ITEMS.filter(item => {
      // Category
      if (selectedCat !== 'all') {
        if (selectedCat === 'nhan_su' && item.category !== 'nhan_su') return false
        if (selectedCat === 'ke_toan' && item.category !== 'ke_toan') return false
        if (selectedCat === 'thue' && item.category !== 'thue') return false
        if (selectedCat === 'bhxh' && item.category !== 'bhxh') return false
        if (selectedCat === 'kpi' && item.category !== 'kpi') return false
        if (selectedCat === 'hop_dong' && item.category !== 'hop_dong') return false
      }

      // Year
      if (selectedYear !== 'all') {
        if (item.year.toString() !== selectedYear) return false
      }

      // Bookmarks filter
      if (onlyBookmarks && !bookmarks.includes(item.id)) {
        return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchDesc = item.description.toLowerCase().includes(q)
        const matchCode = item.code.toLowerCase().includes(q)
        const matchTag = item.tags.some(t => t.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchCode && !matchTag) return false
      }

      return true
    })
  }, [selectedCat, selectedYear, searchQuery, onlyBookmarks, bookmarks])

  const visibleItems = showAllLimit ? filteredItems : filteredItems.slice(0, 18)

  return (
    <div className="w-full">
      {/* 1. TOP HEADER & SEARCH BANNER (Style AZTAX) */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-6 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Title / Brand sub-heading */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
                KK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-900 dark:text-blue-400 tracking-wide text-sm sm:text-base">KHO TÀI LIỆU</span>
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    2026
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Nhân sự • Kế toán • Thuế • BHXH · Cập nhật chuẩn hóa
                </p>
              </div>
            </div>

            {/* Main Search Bar (center pill) */}
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tài liệu, checklist, biểu mẫu, hợp đồng..."
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-all shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setOnlyBookmarks(!onlyBookmarks)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium border transition-all ${
                  onlyBookmarks 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' 
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
                title="Xem tài liệu đã lưu"
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarks ? 'fill-blue-600 text-blue-600' : ''}`} />
                <span className="hidden sm:inline">Đã lưu ({bookmarks.length})</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2. CATEGORY PILL TABS (Horizontal Pill Buttons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {CATEGORIES.map(cat => {
            const isActive = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/20 ring-2 ring-blue-600/30'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* 3. SECONDARY FILTER ROW (Năm, Input keyword, Counter) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span>Năm:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả năm</option>
                <option value="2026">Năm 2026</option>
                <option value="2025">Năm 2025</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm từ khóa tài liệu..."
                className="pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-blue-50 dark:bg-blue-950/50 text-[#1e3a8a] dark:text-blue-300 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/50">
              {filteredItems.length} tài liệu
            </span>
          </div>
        </div>

        {/* 4. DOCUMENT CARDS GRID (3 Columns Exactly like AZTAX sample) */}
        {visibleItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center my-6">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Không tìm thấy tài liệu phù hợp</h3>
            <p className="text-sm text-gray-500 mt-1">Vui lòng thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {visibleItems.map(item => {
              const isSaved = bookmarks.includes(item.id)

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Icon, HOT, Category, Bookmark */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          {item.fileType === 'xlsx' ? (
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                          ) : item.fileType === 'docx' ? (
                            <FileText className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileDown className="w-5 h-5 text-rose-600" />
                          )}
                        </div>

                        {item.isHot && (
                          <span className="bg-[#e67e22] text-white text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase">
                            HOT
                          </span>
                        )}

                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">
                          {item.categoryLabel}
                        </span>
                      </div>

                      <button
                        onClick={e => toggleBookmark(item.id, e)}
                        className="text-gray-300 hover:text-blue-600 transition-colors p-1"
                        title={isSaved ? 'Bỏ lưu' : 'Lưu tài liệu'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
                      </button>
                    </div>

                    {/* Title (Bold deep blue) */}
                    <h2
                      onClick={() => setActiveModalItem(item)}
                      className="text-[#0f2c59] dark:text-blue-200 font-bold text-base sm:text-[17px] leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer min-h-[46px]"
                      title={item.title}
                    >
                      {item.title}
                    </h2>

                    {/* Year Badge */}
                    <div className="mt-2.5">
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded">
                        Năm {item.year}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-[13px] leading-relaxed mt-2.5 line-clamp-2 min-h-[38px]">
                      {item.description}
                    </p>

                    {/* Featured / Tags */}
                    <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                      <span className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/80 text-[11px] font-medium px-2.5 py-0.5 rounded">
                        Featured
                      </span>
                      {item.tags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/80 text-[11px] font-medium px-2 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2 Action Buttons (Exact style: Blue Chi tiết & Xem thử | Orange Tải xuống nhanh) */}
                  <div className="grid grid-cols-2 gap-2.5 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs sm:text-[13px] font-semibold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết & Xem thử</span>
                    </button>

                    <button
                      onClick={(e) => handleDownload(item, e)}
                      className="bg-[#e67e22] hover:bg-[#d35400] text-white text-xs sm:text-[13px] font-semibold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      title={currentUser ? `Tải xuống ${item.filename}` : 'Đăng nhập để tải tài liệu này'}
                    >
                      {currentUser ? (
                        <Download className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-200" />
                      )}
                      <span>{currentUser ? 'Tải xuống nhanh' : 'Đăng nhập để tải'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 5. BOTTOM BUTTON "XEM TẤT CẢ TÀI LIỆU" */}
        {filteredItems.length > 18 && !showAllLimit && (
          <div className="text-center my-8">
            <button
              onClick={() => setShowAllLimit(true)}
              className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-sm px-8 py-3 rounded-xl shadow-md shadow-blue-900/20 transition-all inline-flex items-center gap-2"
            >
              <span>Xem tất cả tài liệu ({filteredItems.length} tài liệu)</span>
            </button>
          </div>
        )}

      </div>

      {/* 6. MODAL XEM CHI TIẾT & TẢI VỀ */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#e67e22] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {activeModalItem.code}
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {activeModalItem.categoryLabel}
              </span>
              <span className="text-xs text-gray-400">
                Định dạng .{activeModalItem.fileType.toUpperCase()} • {activeModalItem.fileSize}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 leading-tight mb-4">
              {activeModalItem.title}
            </h3>

            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                Tóm tắt & Mục đích sử dụng
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {activeModalItem.description}
              </p>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Áp dụng chuẩn quy định pháp luật năm <strong>{activeModalItem.year}</strong>.</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Bảo toàn 100% công thức tính toán tự động trong bảng tính Excel.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={(e) => handleDownload(activeModalItem, e)}
                className="bg-[#e67e22] hover:bg-[#d35400] text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
                title={currentUser ? `Tải xuống ${activeModalItem.filename}` : 'Đăng nhập để tải tài liệu này'}
              >
                {currentUser ? (
                  <Download className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-200" />
                )}
                <span>
                  {currentUser
                    ? `Tải tệp ngay (${activeModalItem.fileType.toUpperCase()})`
                    : `Đăng nhập để tải (${activeModalItem.fileType.toUpperCase()})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL YÊU CẦU ĐĂNG NHẬP */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAuthModal(false)
                setAuthTargetItem(null)
              }}
              className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-gray-50 mb-2">
                Đăng nhập để tải tài liệu
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Tài liệu <span className="font-bold text-gray-900 dark:text-gray-100">{authTargetItem?.title || 'này'}</span> thuộc hệ thống biểu mẫu chuẩn hóa KK HOME. Bạn vui lòng đăng nhập để tải xuống miễn phí.
              </p>

              <div className="space-y-3">
                <Link
                  href="/login?redirect=/tai-lieu"
                  className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </Link>

                <Link
                  href="/register"
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Chưa có tài khoản? Đăng ký miễn phí</span>
                </Link>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Hoàn toàn miễn phí dành cho thành viên KK HOME</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
