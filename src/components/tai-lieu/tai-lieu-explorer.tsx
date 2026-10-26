'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { TAI_LIEU_ITEMS, getPreviewPdfUrl, getGoogleOnlineUrl, toGoogleViewOnlyUrl, type TaiLieuItem } from '@/lib/tai-lieu-data'
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
  UserPlus,
  Loader2,
  AlertCircle,
  GitBranch,
  History,
  Clock,
  Plus,
  RefreshCw,
  Pencil,
  EyeOff,
  Globe
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
  isAdmin?: boolean
  initialItems?: TaiLieuItem[]
  isPublicKho?: boolean
}

export function TaiLieuExplorer({ user, isAdmin = false, initialItems, isPublicKho = true }: TaiLieuExplorerProps = {}) {
  const [items, setItems] = useState<TaiLieuItem[]>(initialItems && initialItems.length > 0 ? initialItems : TAI_LIEU_ITEMS)
  const [isPublic, setIsPublic] = useState(isPublicKho)
  const [isTogglingKho, setIsTogglingKho] = useState(false)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'visible' | 'hidden'>('visible')
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedCat, setSelectedCat] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [onlyBookmarks, setOnlyBookmarks] = useState(false)
  const [activeModalItem, setActiveModalItem] = useState<TaiLieuItem | null>(null)
  const [showAllLimit, setShowAllLimit] = useState(false)

  const [currentUser, setCurrentUser] = useState(user ?? null)
  const [adminMode, setAdminMode] = useState(isAdmin)
  const effectiveAdmin = Boolean(
    isAdmin ||
    adminMode ||
    (currentUser?.email ? currentUser.email.toLowerCase().includes('admin') : false)
  )
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTargetItem, setAuthTargetItem] = useState<TaiLieuItem | null>(null)

  const [previewTab, setPreviewTab] = useState<'pdf' | 'raw' | 'versions' | 'info'>('pdf')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{
    fileType: 'pdf' | 'docx' | 'xlsx'
    url?: string
    html?: string
    sheets?: Array<{ name: string; totalRows: number; maxCols: number; rows: any[][] }>
  } | null>(null)
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  const [allVersions, setAllVersions] = useState<Record<string, Array<{ version: string; releaseDate: string; changelog: string; updatedBy?: string }>>>({})
  const [showVersionForm, setShowVersionForm] = useState(false)
  const [newVersionNum, setNewVersionNum] = useState('')
  const [newReleaseDate, setNewReleaseDate] = useState('')
  const [newChangelog, setNewChangelog] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)

  // Edit info state
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editCategory, setEditCategory] = useState('nhan_su')
  const [editYear, setEditYear] = useState<number | string>(2026)
  const [editDescription, setEditDescription] = useState('')
  const [editHighlights, setEditHighlights] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [editIsHot, setEditIsHot] = useState(false)
  const [editIsHidden, setEditIsHidden] = useState(false)
  const [editGoogleUrl, setEditGoogleUrl] = useState('')
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [infoSaveSuccess, setInfoSaveSuccess] = useState<string | null>(null)
  const [infoSaveError, setInfoSaveError] = useState<string | null>(null)

  // Dedicated Google Link Modal state (Admin)
  const [googleModalItem, setGoogleModalItem] = useState<TaiLieuItem | null>(null)
  const [googleModalUrl, setGoogleModalUrl] = useState('')
  const [isSavingGoogleModal, setIsSavingGoogleModal] = useState(false)

  // Fetch all custom versions
  useEffect(() => {
    fetch('/api/admin/tai-lieu/versions')
      .then((res) => res.json())
      .then((data) => {
        if (data.allVersions) setAllVersions(data.allVersions)
      })
      .catch(() => {})
  }, [])

  function formatVersion(ver?: string) {
    if (!ver) return 'Ver 2026.1'
    ver = ver.trim()
    if (/^v\d/i.test(ver)) {
      return 'Ver ' + ver.slice(1)
    }
    if (!ver.toLowerCase().startsWith('ver')) {
      return 'Ver ' + ver
    }
    return ver.replace(/^ver\s*/i, 'Ver ')
  }

  function getNextVersionNum(currentVer: string) {
    const normalized = formatVersion(currentVer)
    const matchYear = normalized.match(/Ver\s+(\d{4})\.(\d+)/i)
    if (matchYear) {
      const year = matchYear[1]
      const num = parseInt(matchYear[2], 10) + 1
      return `Ver ${year}.${num}`
    }
    const matchGeneral = normalized.match(/Ver\s+(\d+)\.(\d+)/i)
    if (matchGeneral) {
      const major = matchGeneral[1]
      const minor = parseInt(matchGeneral[2], 10) + 1
      return `Ver ${major}.${minor}`
    }
    const matchSingle = normalized.match(/Ver\s+(\d+)/i)
    if (matchSingle) {
      return `Ver ${matchSingle[1]}.1`
    }
    return `${normalized}.1`
  }

  function getVersionsForItem(item: TaiLieuItem) {
    if (allVersions[item.id] && allVersions[item.id].length > 0) {
      return allVersions[item.id].map(v => ({
        ...v,
        version: formatVersion(v.version)
      }))
    }
    const defaultVer = item.version ? formatVersion(item.version) : `Ver ${item.year || 2026}.1`
    return [
      {
        version: defaultVer,
        releaseDate: `${item.year || 2026}-01-15`,
        changelog: `Phiên bản biểu mẫu chuẩn hóa năm ${item.year || 2026}, áp dụng hệ thống căn cứ pháp lý hiện hành tại KK HOME.`,
        updatedBy: 'Hệ thống KK HOME',
      },
    ]
  }

  function getCurrentVersion(item: TaiLieuItem) {
    if (allVersions[item.id] && allVersions[item.id].length > 0) {
      return formatVersion(allVersions[item.id][0]?.version)
    }
    if (item.version) {
      return formatVersion(item.version)
    }
    return `Ver ${item.year || 2026}.1`
  }

  function openVersionForm(item: TaiLieuItem) {
    const current = getCurrentVersion(item)
    const nextVer = getNextVersionNum(current)
    setNewVersionNum(nextVer)
    setNewReleaseDate(new Date().toISOString().split('T')[0])
    setNewChangelog('')
    setShowVersionForm(true)
  }

  async function handleSaveNewVersion(e: React.FormEvent) {
    e.preventDefault()
    if (!activeModalItem || !newVersionNum.trim() || !newChangelog.trim()) {
      toast.error('Vui lòng điền đầy đủ số phiên bản và nội dung thay đổi')
      return
    }

    setSavingVersion(true)
    try {
      const res = await fetch('/api/admin/tai-lieu/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeModalItem.id,
          version: newVersionNum.trim(),
          releaseDate: newReleaseDate,
          changelog: newChangelog.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu phiên bản mới')

      setAllVersions(data.allVersions)
      toast.success(data.message || 'Đã cập nhật phiên bản mới thành công!')
      setShowVersionForm(false)
      setNewChangelog('')
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi cập nhật phiên bản')
    } finally {
      setSavingVersion(false)
    }
  }

  function startEditInfo(item: TaiLieuItem) {
    setEditTitle(item.title)
    setEditCode(item.code)
    setEditCategory(item.category)
    setEditYear(item.year || 2026)
    setEditDescription(item.description || '')
    const currentHighlights = item.highlights && item.highlights.length > 0
      ? item.highlights
      : [
          `Áp dụng chuẩn quy định pháp luật năm ${item.year || 2026}.`,
          `Bảo toàn 100% công thức tính toán tự động trong bảng tính ${item.fileType ? item.fileType.toUpperCase() : 'Excel'}.`,
          `Sẵn sàng chỉnh sửa, in ấn và áp dụng ngay cho doanh nghiệp.`
        ]
    setEditHighlights(currentHighlights.join('\n'))
    setEditTags(item.tags ? item.tags.join(', ') : '')
    setEditFeatured(Boolean(item.featured))
    setEditIsHot(Boolean(item.isHot))
    setEditIsHidden(Boolean(item.isHidden))
    setEditGoogleUrl(item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl || '')
    setInfoSaveSuccess(null)
    setInfoSaveError(null)
    setIsEditingInfo(true)
  }

  function cancelEditInfo() {
    setIsEditingInfo(false)
    setInfoSaveSuccess(null)
    setInfoSaveError(null)
  }

  function openGoogleModal(item: TaiLieuItem, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setGoogleModalItem(item)
    setGoogleModalUrl(item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl || '')
  }

  async function handleSaveGoogleModal(e: React.FormEvent) {
    e.preventDefault()
    if (!googleModalItem) return
    setIsSavingGoogleModal(true)
    try {
      const cleanUrl = googleModalUrl.trim()
      const viewOnlyUrl = cleanUrl ? toGoogleViewOnlyUrl(cleanUrl) : ''
      const isXlsx = googleModalItem.fileType === 'xlsx'
      const isDocx = googleModalItem.fileType === 'docx'

      const res = await fetch('/api/admin/tai-lieu/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: googleModalItem.id,
          googleSheetUrl: isXlsx ? viewOnlyUrl : undefined,
          googleDocUrl: isDocx ? viewOnlyUrl : undefined,
          googleDriveUrl: viewOnlyUrl || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu liên kết Google')

      if (data.item) {
        setItems(prev => prev.map(it => it.id === data.item.id ? data.item : it))
        if (activeModalItem?.id === data.item.id) {
          setActiveModalItem(data.item)
        }
      }

      toast.success(
        viewOnlyUrl
          ? `Đã gắn liên kết ${isDocx ? 'Google Docs' : 'Google Sheets'} (Chế độ Chỉ Xem) thành công!`
          : 'Đã xóa liên kết Google riêng!'
      )
      setGoogleModalItem(null)
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lưu liên kết')
    } finally {
      setIsSavingGoogleModal(false)
    }
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    if (!activeModalItem) return
    setIsSavingInfo(true)
    setInfoSaveError(null)
    setInfoSaveSuccess(null)

    try {
      const res = await fetch('/api/admin/tai-lieu/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeModalItem.id,
          title: editTitle,
          code: editCode,
          category: editCategory,
          year: Number(editYear),
          description: editDescription,
          highlights: editHighlights.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean),
          tags: editTags.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean),
          featured: editFeatured,
          isHot: editIsHot,
          isHidden: editIsHidden,
          googleSheetUrl: activeModalItem.fileType === 'xlsx' ? editGoogleUrl.trim() : undefined,
          googleDocUrl: activeModalItem.fileType === 'docx' ? editGoogleUrl.trim() : undefined,
          googleDriveUrl: editGoogleUrl.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi khi lưu thông tin biểu mẫu')
      }

      if (data.item) {
        try {
          const saved = JSON.parse(localStorage.getItem('kkhome_tailieu_hidden') || '{}')
          saved[data.item.id] = Boolean(data.item.isHidden)
          if (data.item.filename) saved[data.item.filename] = Boolean(data.item.isHidden)
          localStorage.setItem('kkhome_tailieu_hidden', JSON.stringify(saved))
        } catch {}
        setItems(prev => prev.map(it => it.id === data.item.id ? data.item : it))
        setActiveModalItem(data.item)
      }

      setInfoSaveSuccess('Đã cập nhật thông tin và tóm tắt thành công!')
      toast.success('Đã lưu thông tin biểu mẫu thành công!')
      setTimeout(() => {
        setIsEditingInfo(false)
        setInfoSaveSuccess(null)
      }, 1000)
    } catch (err: any) {
      setInfoSaveError(err?.message || 'Không thể lưu thông tin')
      toast.error(err?.message || 'Lỗi khi lưu thông tin biểu mẫu')
    } finally {
      setIsSavingInfo(false)
    }
  }

  async function handleToggleItemVisibility(item: TaiLieuItem, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setTogglingItemId(item.id)
    const nextHidden = !Boolean(item.isHidden)

    // Save to localStorage as immediate persistent cache across reloads
    try {
      const saved = JSON.parse(localStorage.getItem('kkhome_tailieu_hidden') || '{}')
      saved[item.id] = nextHidden
      if (item.filename) saved[item.filename] = nextHidden
      localStorage.setItem('kkhome_tailieu_hidden', JSON.stringify(saved))
    } catch {}

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isHidden: nextHidden } : it))
    )
    if (activeModalItem?.id === item.id) {
      setActiveModalItem((prev) => (prev ? { ...prev, isHidden: nextHidden } : null))
    }

    try {
      const res = await fetch('/api/admin/tai-lieu/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isHidden: nextHidden }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật trạng thái hiển thị')
      if (data.item) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, ...data.item, isHidden: nextHidden } : it))
        )
      }
      toast.success(
        data.message || (nextHidden ? 'Đã tạm ẩn biểu mẫu' : 'Đã hiển thị biểu mẫu cho người khác')
      )
    } catch (err: any) {
      // Rollback
      try {
        const saved = JSON.parse(localStorage.getItem('kkhome_tailieu_hidden') || '{}')
        saved[item.id] = !nextHidden
        if (item.filename) saved[item.filename] = !nextHidden
        localStorage.setItem('kkhome_tailieu_hidden', JSON.stringify(saved))
      } catch {}

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isHidden: !nextHidden } : it))
      )
      if (activeModalItem?.id === item.id) {
        setActiveModalItem((prev) => (prev ? { ...prev, isHidden: !nextHidden } : null))
      }
      toast.error(err?.message || 'Lỗi khi cập nhật trạng thái hiển thị')
    } finally {
      setTogglingItemId(null)
    }
  }

  async function handleToggleKhoVisibility() {
    setIsTogglingKho(true)
    const nextPublic = !isPublic
    setIsPublic(nextPublic)
    setSelectedVisibility('visible')

    try {
      const res = await fetch('/api/admin/tai-lieu/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublicKho: nextPublic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật trạng thái kho')
      toast.success(
        data.message || (nextPublic ? 'Kho biểu mẫu đã mở công khai!' : 'Kho biểu mẫu đã tạm ẩn!')
      )
    } catch (err: any) {
      setIsPublic(!nextPublic)
      toast.error(err?.message || 'Lỗi khi cập nhật trạng thái kho')
    } finally {
      setIsTogglingKho(false)
    }
  }

  useEffect(() => {
    setIsEditingInfo(false)
    setInfoSaveSuccess(null)
    setInfoSaveError(null)
    setShowVersionForm(false)

    if (!activeModalItem) {
      setPreviewData(null)
      setPreviewError(null)
      return
    }

    const hasPdf = activeModalItem.fileType === 'pdf' || activeModalItem.hasPreviewPdf !== false
    setPreviewTab(hasPdf ? 'pdf' : 'raw')
    setActiveSheetIndex(0)
    setPreviewError(null)

    // Direct PDF URL for instant preview (every document has an exact matching PDF)
    const directPdfUrl = getPreviewPdfUrl(activeModalItem)
    setPreviewData({
      fileType: activeModalItem.fileType,
      url: hasPdf ? directPdfUrl : undefined,
    })
    setPreviewLoading(false)

    // Also fetch API to sync or fallback if ever needed
    fetch(`/api/tai-lieu/preview?id=${encodeURIComponent(activeModalItem.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải bản xem trước')
        return res.json()
      })
      .then((data) => {
        if (data && !data.error) {
          setPreviewData(data)
        }
      })
      .catch((err) => {
        if (!directPdfUrl) {
          setPreviewError(err?.message || 'Lỗi khi tải bản xem trước')
        }
      })
  }, [activeModalItem?.id])

  useEffect(() => {
    setCurrentUser(user ?? null)
    if (isAdmin) setAdminMode(true)
  }, [user, isAdmin])

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems)
    }
  }, [initialItems])

  useEffect(() => {
    if (isPublicKho !== undefined) {
      setIsPublic(isPublicKho)
    }
  }, [isPublicKho])

  useEffect(() => {
    const supabase = createClient()

    async function verifyAdminRole(userId: string) {
      try {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
        if (data?.is_admin) {
          setAdminMode(true)
        }
      } catch {}
    }

    if (currentUser?.id) {
      verifyAdminRole(currentUser.id)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setCurrentUser(u)
      if (u?.id) {
        verifyAdminRole(u.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Merge locally cached hidden status from localStorage if initialItems not loaded
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('kkhome_tailieu_hidden') || '{}')
      if (Object.keys(saved).length > 0 && (!initialItems || initialItems.length === 0)) {
        setItems((prev) =>
          prev.map((it) => {
            if (saved[it.id] !== undefined) {
              return { ...it, isHidden: Boolean(saved[it.id]) }
            }
            if (saved[it.filename] !== undefined) {
              return { ...it, isHidden: Boolean(saved[it.filename]) }
            }
            return it
          })
        )
      }
    } catch {}
  }, [initialItems])

  // Sync fresh visibility state from API
  useEffect(() => {
    fetch('/api/admin/tai-lieu/visibility')
      .then(res => res.json())
      .then(data => {
        if (!data) return
        if (data.isPublicKho !== undefined) {
          setIsPublic(Boolean(data.isPublicKho))
          if (data.isPublicKho === false && !effectiveAdmin) {
            window.location.href = '/'
            return
          }
        }
        if (data.metadata) {
          try {
            const localHidden: Record<string, boolean> = {}
            Object.entries(data.metadata).forEach(([k, v]: [string, any]) => {
              if (v?.isHidden !== undefined) localHidden[k] = Boolean(v.isHidden)
            })
            localStorage.setItem('kkhome_tailieu_hidden', JSON.stringify(localHidden))
          } catch {}

          setItems(prev => {
            const updated = prev.map(item => {
              const meta = data.metadata[item.id] || data.metadata[item.filename] || data.metadata[item.code]
              if (!meta) return item
              return {
                ...item,
                isHidden: meta.isHidden !== undefined ? Boolean(meta.isHidden) : item.isHidden,
                googleSheetUrl: meta.googleSheetUrl !== undefined ? meta.googleSheetUrl : item.googleSheetUrl,
                googleDocUrl: meta.googleDocUrl !== undefined ? meta.googleDocUrl : item.googleDocUrl,
                googleDriveUrl: meta.googleDriveUrl !== undefined ? meta.googleDriveUrl : item.googleDriveUrl,
              }
            })
            return effectiveAdmin ? updated : updated.filter(it => !it.isHidden)
          })
        }
      })
      .catch(() => {})
  }, [effectiveAdmin])

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

  async function handleSyncFolder() {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/admin/tai-lieu/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi đồng bộ')
      if (data.items) {
        setItems(data.items)
      }
      toast.success(data.message || `Đã tự động cập nhật ${data.count} biểu mẫu từ thư mục!`)
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đồng bộ thư mục')
    } finally {
      setIsSyncing(false)
    }
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Kiểm tra trạng thái Kho: Khi kho Tạm ẩn, người dùng thông thường không xem được
      if (!isPublic && !effectiveAdmin) {
        return false
      }

      // 2. Lọc theo trạng thái hiển thị của từng biểu mẫu
      if (effectiveAdmin) {
        // Admin: lọc chính xác theo lựa chọn hiển thị
        if (selectedVisibility === 'visible' && item.isHidden) return false
        if (selectedVisibility === 'hidden' && !item.isHidden) return false
      } else {
        // Người dùng thông thường: chỉ hiển thị những mẫu không bị ẩn
        if (item.isHidden) return false
      }

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
  }, [selectedCat, selectedYear, searchQuery, onlyBookmarks, bookmarks, items, effectiveAdmin, selectedVisibility, isPublic])

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
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {effectiveAdmin && (
                <button
                  onClick={handleToggleKhoVisibility}
                  disabled={isTogglingKho}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${
                    isPublic
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 ring-2 ring-amber-300'
                  }`}
                  title={
                    isPublic
                      ? 'Kho tài liệu đang hiển thị công khai cho mọi người xem - Bấm để chuyển sang tạm ẩn'
                      : 'Kho tài liệu đang tạm ẩn (chỉ Admin xem) - Bấm để mở hiển thị công khai'
                  }
                >
                  {isTogglingKho ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPublic ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{isPublic ? 'Kho: Công khai' : 'Kho: Tạm ẩn'}</span>
                </button>
              )}

              <button
                onClick={handleSyncFolder}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                title="Quét và tự động đồng bộ lại biểu mẫu từ thư mục"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang quét...' : 'Đồng bộ thư mục'}</span>
              </button>

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

            {effectiveAdmin && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                <span>Hiển thị:</span>
                <select
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value as any)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visible">
                    Đang hiển thị ({items.filter((i) => !i.isHidden).length})
                  </option>
                  <option value="hidden">Mẫu đang bị ẩn ({items.filter((i) => i.isHidden).length})</option>
                  <option value="all">Tất cả mẫu ({items.length}) [Chế độ quản trị]</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {effectiveAdmin && (
              <button
                onClick={handleToggleKhoVisibility}
                disabled={isTogglingKho}
                className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-1.5 rounded-full border transition-all shadow-xs ${
                  isPublic
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
                title={
                  isPublic
                    ? 'Kho tài liệu đang hiển thị công khai cho mọi người - Bấm để tạm ẩn chỉ Admin xem'
                    : 'Kho tài liệu đang tạm ẩn - Bấm để mở hiển thị công khai cho người khác xem'
                }
              >
                {isTogglingKho ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPublic ? (
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{isPublic ? 'Kho: Công khai' : 'Kho: Tạm ẩn'}</span>
              </button>
            )}

            <button
              onClick={handleSyncFolder}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 transition-all disabled:opacity-50 shadow-xs"
              title="Quét và cập nhật biểu mẫu từ thư mục"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang quét...' : 'Đồng bộ thư mục'}</span>
            </button>
            <span className="bg-blue-50 dark:bg-blue-950/50 text-[#1e3a8a] dark:text-blue-300 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/50">
              {!isPublic && !effectiveAdmin
                ? 'Kho đang tạm ẩn'
                : `${filteredItems.length} tài liệu`}
            </span>
          </div>
        </div>

        {/* Admin notice when viewing templates while kho is hidden */}
        {effectiveAdmin && !isPublic && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 mb-6 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Lưu ý Quản trị viên:</span> Kho tài liệu hiện đang ở trạng thái <strong>Tạm ẩn toàn bộ</strong> với người dùng thông thường. Bạn đang xem và quản lý danh sách biểu mẫu ở chế độ Quản trị viên.
              </div>
            </div>
            <button
              onClick={handleToggleKhoVisibility}
              disabled={isTogglingKho}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Mở hiển thị công khai kho</span>
            </button>
          </div>
        )}

        {/* 4. DOCUMENT CARDS GRID */}
        {!isPublic && !effectiveAdmin ? (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-3xl p-8 sm:p-14 text-center my-6 shadow-sm max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-amber-200 dark:border-amber-700">
              Trạng thái: Kho Tạm Ẩn
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">
              Kho tài liệu đang tạm ẩn toàn bộ
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed mb-6">
              Kho tài liệu đã được chuyển sang chế độ tạm ẩn. Toàn bộ biểu mẫu hiện không hiển thị với người dùng.
            </p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center my-6">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Không tìm thấy tài liệu phù hợp</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedVisibility === 'hidden'
                ? 'Hiện tại không có biểu mẫu nào đang bị ẩn.'
                : 'Vui lòng thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {visibleItems.map(item => {
              const isSaved = bookmarks.includes(item.id)

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${
                    item.isHidden
                      ? 'border-rose-300/80 dark:border-rose-900/60 bg-rose-50/15 dark:bg-rose-950/10 hover:border-rose-400'
                      : 'border-gray-200/90 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                >
                  <div>
                    {/* Top row: Icon, HOT, Category, Bookmark */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
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

                        {effectiveAdmin && item.isHidden && (
                          <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                            <EyeOff className="w-2.5 h-2.5" />
                            Đang ẩn
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {effectiveAdmin && (
                          <button
                            onClick={e => handleToggleItemVisibility(item, e)}
                            disabled={togglingItemId === item.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                              item.isHidden
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={
                              item.isHidden
                                ? 'Đang ẩn với người khác - Bấm để hiển thị'
                                : 'Đang hiển thị cho người khác xem - Bấm để ẩn'
                            }
                          >
                            {togglingItemId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : item.isHidden ? (
                              <>
                                <EyeOff className="w-3 h-3 text-rose-600" />
                                <span>Không hiển thị</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 text-emerald-600" />
                                <span>Hiển thị</span>
                              </>
                            )}
                          </button>
                        )}

                        {effectiveAdmin && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setActiveModalItem(item)
                              setPreviewTab('info')
                              startEditInfo(item)
                            }}
                            className="text-gray-400 hover:text-amber-600 transition-colors p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Điều chỉnh thông tin & tóm tắt"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {effectiveAdmin && (
                          <button
                            onClick={e => openGoogleModal(item, e)}
                            className={`p-1 rounded-lg transition-colors ${
                              item.googleSheetUrl || item.googleDocUrl
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={
                              item.googleSheetUrl || item.googleDocUrl
                                ? `Đã có link riêng (${item.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'}) - Bấm để đổi link`
                                : `Cài đặt link ${item.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} trực tuyến (Modal)`
                            }
                          >
                            {item.fileType === 'docx' ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={e => toggleBookmark(item.id, e)}
                          className="text-gray-300 hover:text-blue-600 transition-colors p-1"
                          title={isSaved ? 'Bỏ lưu' : 'Lưu tài liệu'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title (Bold deep blue) */}
                    <h2
                      onClick={() => setActiveModalItem(item)}
                      className="text-[#0f2c59] dark:text-blue-200 font-bold text-base sm:text-[17px] leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer min-h-[46px]"
                      title={item.title}
                    >
                      {item.title}
                    </h2>

                    {/* Year & Version Badge */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded">
                        Năm {item.year}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-800/80">
                        <GitBranch className="w-3 h-3 text-blue-500" />
                        {getCurrentVersion(item)}
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

                  {/* 2 Action Buttons (Exact style: Blue Chi tiết & Xem thử | Orange Tải xuống nhanh) + Google Sheets/Docs Link */}
                  <div className="space-y-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setActiveModalItem(item)}
                        className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs sm:text-[13px] font-semibold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem thử mẫu PDF</span>
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

                    <div className="flex items-center gap-1.5 w-full">
                      <a
                        href={getGoogleOnlineUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          item.fileType === 'docx'
                            ? 'bg-blue-50/70 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60'
                            : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60'
                        }`}
                        title={
                          item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl
                            ? `Mở xem trực tuyến trên ${item.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} (Chế độ chỉ xem)`
                            : `Xem trước tài liệu chuẩn của ${item.title}`
                        }
                      >
                        {item.fileType === 'docx' ? (
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl
                            ? (item.fileType === 'docx' ? 'Google Docs (Chỉ xem)' : 'Google Sheets (Chỉ xem)')
                            : (item.fileType === 'docx' ? 'Mở xem Google Docs' : 'Mở xem Google Sheets')}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      {effectiveAdmin && (
                        <button
                          onClick={(e) => openGoogleModal(item, e)}
                          className={`px-2.5 py-1.5 rounded-xl border border-dashed text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                            item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl
                              ? 'border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                              : 'border-amber-400 bg-amber-50/60 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                          }`}
                          title={
                            item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl
                              ? 'Đã có link Google (Bấm để đổi link)'
                              : 'Chưa cài link Google Sheets/Docs trực tuyến (Bấm để cài link)'
                          }
                        >
                          <Pencil className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">
                            {item.googleSheetUrl || item.googleDocUrl || item.googleDriveUrl ? 'Đổi link' : 'Cài link'}
                          </span>
                        </button>
                      )}
                    </div>
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

      {/* 6. MODAL XEM CHI TIẾT & XEM THỬ NỘI DUNG */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-5xl w-full max-h-[92vh] shadow-2xl flex flex-col relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:px-6 sm:pt-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-10">
                <span className="bg-[#e67e22] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {activeModalItem.code}
                </span>
                <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {activeModalItem.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/80">
                  <GitBranch className="w-3 h-3 text-blue-500" />
                  {getCurrentVersion(activeModalItem)}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Định dạng .{activeModalItem.fileType.toUpperCase()} • {activeModalItem.fileSize}
                </span>

                {effectiveAdmin && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    activeModalItem.isHidden
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {activeModalItem.isHidden ? (
                      <>
                        <EyeOff className="w-2.5 h-2.5 text-rose-600" />
                        <span>Không hiển thị</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Hiển thị</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pr-10">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 leading-snug line-clamp-2">
                  {activeModalItem.title}
                </h3>
                {effectiveAdmin && (
                  <button
                    onClick={() => {
                      setPreviewTab('info')
                      startEditInfo(activeModalItem)
                    }}
                    title="Điều chỉnh thông tin & tóm tắt biểu mẫu"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tab Selector */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={() => setPreviewTab('pdf')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    previewTab === 'pdf'
                      ? 'bg-[#1e3a8a] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem thử mẫu PDF</span>
                </button>

                {activeModalItem.fileType === 'xlsx' && (
                  <button
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                      previewTab === 'raw'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Bảng tính Excel</span>
                  </button>
                )}

                {activeModalItem.fileType === 'docx' && (
                  <button
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                      previewTab === 'raw'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Nội dung Word</span>
                  </button>
                )}

                <button
                  onClick={() => setPreviewTab('versions')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    previewTab === 'versions'
                      ? 'bg-[#1e3a8a] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Phiên bản ({getVersionsForItem(activeModalItem).length})</span>
                </button>

                <button
                  onClick={() => setPreviewTab('info')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    previewTab === 'info'
                      ? 'bg-[#1e3a8a] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Thông tin & Tóm tắt</span>
                </button>

                <a
                  href={getGoogleOnlineUrl(activeModalItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all border shadow-xs ml-auto ${
                    activeModalItem.fileType === 'docx'
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                  title={`Mở và làm việc trực tiếp trên ${activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'}`}
                >
                  {activeModalItem.fileType === 'docx' ? (
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Mở {activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} (Chỉ xem)</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>

                {effectiveAdmin && (
                  <button
                    onClick={() => openGoogleModal(activeModalItem)}
                    className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all shadow-xs"
                    title="Cài đặt link Google Sheets / Google Docs trực tuyến (Modal)"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cài link Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[360px] bg-gray-50/50 dark:bg-gray-950/40">
              {previewTab === 'pdf' ? (
                <div>
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-[460px] text-gray-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm font-medium text-gray-500">Đang chuẩn bị bản xem trước PDF...</p>
                    </div>
                  ) : previewError ? (
                    <div className="flex flex-col items-center justify-center h-[360px] text-center p-6 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                      <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{previewError}</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-md">
                        Bạn có thể tải file về để xem toàn bộ nội dung trực tiếp trên thiết bị của mình.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Top Action Bar for PDF Viewer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-xs">
                            PDF
                          </span>
                          <span className="font-semibold text-blue-950 dark:text-blue-200">
                            Bản xem trước trực quan (Định dạng PDF chuẩn hóa)
                          </span>
                          {activeModalItem.fileType !== 'pdf' && (
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden md:inline">
                              • Tệp gốc tải về: <strong>.{activeModalItem.fileType.toUpperCase()}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={previewData?.url || getPreviewPdfUrl(activeModalItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:underline px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 shadow-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở toàn màn hình</span>
                          </a>
                        </div>
                      </div>

                      {/* PDF Viewer Frame */}
                      <div className="w-full h-[600px] sm:h-[680px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 shadow-inner relative">
                        <iframe
                          src={`${previewData?.url || getPreviewPdfUrl(activeModalItem)}#toolbar=1&navpanes=0`}
                          className="w-full h-full border-0"
                          title={activeModalItem.title}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : previewTab === 'raw' ? (
                <div>
                  {activeModalItem.fileType === 'docx' && previewData?.html ? (
                    <div className="bg-gray-200/80 dark:bg-gray-950 p-3 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[580px]">
                      <div className="bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 max-w-3xl mx-auto p-6 sm:p-10 min-h-[500px]">
                        <div
                          className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:my-2 prose-p:leading-relaxed prose-table:border prose-table:border-gray-300 prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:bg-gray-100"
                          dangerouslySetInnerHTML={{ __html: previewData.html }}
                        />
                      </div>
                    </div>
                  ) : activeModalItem.fileType === 'xlsx' && previewData?.sheets ? (
                    <div className="space-y-3">
                      {/* Sheet tabs if multiple */}
                      {previewData.sheets.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {previewData.sheets.map((sheet, sIdx) => (
                            <button
                              key={sheet.name}
                              onClick={() => setActiveSheetIndex(sIdx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                activeSheetIndex === sIdx
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>{sheet.name}</span>
                              <span className="text-[10px] opacity-75">({sheet.totalRows} dòng)</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Spreadsheet table */}
                      {(() => {
                        const currentSheet = previewData.sheets[activeSheetIndex]
                        if (!currentSheet) return null

                        return (
                          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-inner">
                            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                              <table className="w-full text-xs text-left border-collapse">
                                <tbody>
                                  {currentSheet.rows.map((row, rIdx) => {
                                    const isHeader = rIdx < 2
                                    return (
                                      <tr
                                        key={rIdx}
                                        className={
                                          rIdx % 2 === 0
                                            ? 'bg-white dark:bg-gray-900 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                            : 'bg-gray-50/80 dark:bg-gray-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                        }
                                      >
                                        <td className="px-2 py-1 border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-400 font-mono text-[10px] text-center select-none w-10">
                                          {rIdx + 1}
                                        </td>
                                        {Array.from({ length: currentSheet.maxCols }).map((_, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className={`px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 whitespace-nowrap ${
                                              isHeader ? 'font-semibold text-gray-900 dark:text-gray-100' : ''
                                            }`}
                                          >
                                            {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : ''}
                                          </td>
                                        ))}
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2">
                              <span>
                                Hiển thị {Math.min(currentSheet.rows.length, 100)} / {currentSheet.totalRows} dòng
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Bảo toàn 100% công thức Excel tự động khi tải về
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[360px] text-gray-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm font-medium text-gray-500">Đang chuẩn bị dữ liệu...</p>
                    </div>
                  )}
                </div>
              ) : previewTab === 'versions' ? (
                /* Versions Tab */
                <div className="space-y-6 max-w-3xl mx-auto py-2">
                  {/* Top Bar with Admin action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Phiên bản hiện hành</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                          {getCurrentVersion(activeModalItem)}
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Mới nhất
                        </span>
                      </div>
                    </div>

                    {effectiveAdmin && (
                      <button
                        onClick={() => openVersionForm(activeModalItem)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Phát hành Ver mới</span>
                      </button>
                    )}
                  </div>

                  {/* Form update version (if open) */}
                  {showVersionForm && (
                    <form onSubmit={handleSaveNewVersion} className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/60">
                        <h4 className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          Phát hành phiên bản mới cho mẫu
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowVersionForm(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Mã phiên bản (Ver) *
                          </label>
                          <input
                            type="text"
                            required
                            value={newVersionNum}
                            onChange={(e) => setNewVersionNum(e.target.value)}
                            placeholder="Ví dụ: Ver 2026.2 hoặc Ver 2.0"
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Ngày phát hành / áp dụng *
                          </label>
                          <input
                            type="date"
                            required
                            value={newReleaseDate}
                            onChange={(e) => setNewReleaseDate(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Nội dung cập nhật & Căn cứ sửa đổi (Changelog) *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={newChangelog}
                          onChange={(e) => setNewChangelog(e.target.value)}
                          placeholder="Mô tả chi tiết những điểm mới, các điều khoản/công thức được cập nhật, căn cứ theo luật, thông tư hay nghị định nào..."
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowVersionForm(false)}
                          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={savingVersion}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          {savingVersion && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Lưu & Xuất bản phiên bản này</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Versions Timeline List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Lịch sử các phiên bản phát hành
                    </h4>

                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                      {getVersionsForItem(activeModalItem).map((ver, idx) => {
                        const isLatest = idx === 0
                        return (
                          <div key={ver.version + idx} className="relative flex items-start gap-4 group">
                            {/* Dot on timeline */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              isLatest
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 ring-4 ring-white dark:ring-gray-900'
                            }`}>
                              <GitBranch className="w-3.5 h-3.5" />
                            </div>

                            {/* Card Content */}
                            <div className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${
                              isLatest
                                ? 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 shadow-sm'
                                : 'bg-white/70 dark:bg-gray-900/60 border-gray-100 dark:border-gray-800'
                            }`}>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-base text-gray-900 dark:text-gray-50">
                                    {ver.version}
                                  </span>
                                  {isLatest && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                      Phiên bản hiện hành
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {ver.releaseDate}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {ver.changelog}
                              </p>

                              {ver.updatedBy && (
                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-[11px] text-gray-400">
                                  Phát hành bởi: <span className="font-medium text-gray-600 dark:text-gray-300">{ver.updatedBy}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Information Tab */
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  {/* Top Bar with Admin action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Thông tin chi tiết & Căn cứ áp dụng</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          Mã: <span className="text-blue-600 dark:text-blue-400 font-mono font-extrabold">{activeModalItem.code}</span>
                        </span>
                        <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Danh mục: <strong className="text-gray-800 dark:text-gray-200">{activeModalItem.categoryLabel}</strong>
                        </span>
                        <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Năm: <strong className="text-gray-800 dark:text-gray-200">{activeModalItem.year}</strong>
                        </span>
                      </div>
                    </div>

                    {effectiveAdmin && !isEditingInfo && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleItemVisibility(activeModalItem)}
                          disabled={togglingItemId === activeModalItem.id}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 shadow-xs ${
                            activeModalItem.isHidden
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                          }`}
                          title={
                            activeModalItem.isHidden
                              ? 'Đang ẩn với người khác - Bấm để hiển thị'
                              : 'Đang hiển thị cho người khác xem - Bấm để ẩn'
                          }
                        >
                          {togglingItemId === activeModalItem.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : activeModalItem.isHidden ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                              <span>Không hiển thị (Bấm để mở)</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đang hiển thị (Bấm để ẩn)</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openGoogleModal(activeModalItem)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          title="Cài đặt link Google Sheets / Google Docs trực tuyến (Modal)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Cài link Google</span>
                        </button>

                        <button
                          onClick={() => startEditInfo(activeModalItem)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Điều chỉnh</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingInfo ? (
                    /* Edit Form */
                    <form onSubmit={handleSaveInfo} className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/60">
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-200 flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-amber-600" />
                            Điều chỉnh thông tin & Tóm tắt biểu mẫu
                          </h4>
                          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            Cập nhật tiêu đề tiếng Việt chuẩn, tóm tắt mục đích, từ khóa và đặc quyền hiển thị.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={cancelEditInfo}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {infoSaveError && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{infoSaveError}</span>
                        </div>
                      )}

                      {infoSaveSuccess && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{infoSaveSuccess}</span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        {/* Title */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Tiêu đề biểu mẫu (Tiếng Việt chuẩn có dấu) *
                          </label>
                          <input
                            type="text"
                            required
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Ví dụ: Sổ Quản Lý Lao Động 2026"
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                          />
                        </div>

                        {/* Code, Category, Year */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                              Mã biểu mẫu *
                            </label>
                            <input
                              type="text"
                              required
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              placeholder="Ví dụ: NS01"
                              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                              Phân loại danh mục *
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                            >
                              <option value="nhan_su">Nhân sự - Lương</option>
                              <option value="ke_toan">Kế toán - Thuế</option>
                              <option value="thue">Pháp lý doanh nghiệp & Thuế</option>
                              <option value="bhxh">Bảo hiểm Xã hội</option>
                              <option value="kpi">Đánh giá KPI</option>
                              <option value="hop_dong">Hợp đồng & Biểu mẫu</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                              Năm áp dụng *
                            </label>
                            <input
                              type="number"
                              required
                              value={editYear}
                              onChange={(e) => setEditYear(e.target.value)}
                              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Description / Summary */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Tóm tắt & Mục đích sử dụng *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Mô tả mục đích sử dụng, căn cứ pháp lý, đối tượng áp dụng..."
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                          />
                        </div>

                        {/* Highlights */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Các điểm nổi bật & Căn cứ áp dụng (mỗi dòng một gạch đầu dòng)
                          </label>
                          <textarea
                            rows={3}
                            value={editHighlights}
                            onChange={(e) => setEditHighlights(e.target.value)}
                            placeholder="Áp dụng chuẩn quy định pháp luật năm 2026.&#10;Bảo toàn 100% công thức tính toán tự động trong bảng tính Excel.&#10;Sẵn sàng chỉnh sửa, in ấn và áp dụng ngay cho doanh nghiệp."
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            Mỗi dòng sẽ hiển thị thành một gạch đầu dòng có dấu tích xanh (Check) trong phần thông tin.
                          </p>
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Từ khóa tìm kiếm (phân cách bởi dấu phẩy)
                          </label>
                          <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="Nhân sự, Excel, Quản lý lao động, Nghị định 145"
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            Giúp người dùng tìm thấy biểu mẫu nhanh chóng khi gõ trên thanh tìm kiếm.
                          </p>
                        </div>

                        {/* Link Google Sheet / Google Docs */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                            Link {activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} trực tuyến (Tùy chọn)
                          </label>
                          <input
                            type="url"
                            value={editGoogleUrl}
                            onChange={(e) => setEditGoogleUrl(e.target.value)}
                            placeholder={
                              activeModalItem.fileType === 'docx'
                                ? 'https://docs.google.com/document/d/.../copy hoặc /edit'
                                : 'https://docs.google.com/spreadsheets/d/.../copy hoặc /edit'
                            }
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            Dán link Google Drive của bạn (dạng <code>/copy</code> để người dùng tự động nhân bản vào Drive cá nhân). Nếu để trống, hệ thống sẽ tự động liên kết mở qua Google Docs Viewer.
                          </p>
                        </div>

                        {/* Trạng thái hiển thị */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Trạng thái hiển thị cho người khác xem *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                              onClick={() => setEditIsHidden(false)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                !editIsHidden
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="formVisibility"
                                checked={!editIsHidden}
                                onChange={() => setEditIsHidden(false)}
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Hiển thị biểu mẫu</span>
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  Công khai để người khác có thể tìm kiếm, xem trước và tải về.
                                </div>
                              </div>
                            </label>

                            <label
                              onClick={() => setEditIsHidden(true)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                editIsHidden
                                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="formVisibility"
                                checked={editIsHidden}
                                onChange={() => setEditIsHidden(true)}
                                className="mt-0.5 text-rose-600 focus:ring-rose-500"
                              />
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Không hiển thị (Tạm ẩn)</span>
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  Chỉ có Admin nhìn thấy, người khác sẽ không thấy biểu mẫu này.
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Checkboxes: Featured & isHot */}
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={editFeatured}
                              onChange={(e) => setEditFeatured(e.target.checked)}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-700"
                            />
                            <span>⭐ Đặt làm Biểu mẫu Nổi bật (Featured)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={editIsHot}
                              onChange={(e) => setEditIsHot(e.target.checked)}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-700"
                            />
                            <span>🔥 Gắn nhãn HOT</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-amber-200/60 dark:border-amber-900/60">
                        <button
                          type="button"
                          onClick={cancelEditInfo}
                          disabled={isSavingInfo}
                          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingInfo}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          {isSavingInfo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Lưu thay đổi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Normal View */
                    <div className="space-y-4">
                      {effectiveAdmin && (
                        <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                          activeModalItem.isHidden
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            {activeModalItem.isHidden ? (
                              <EyeOff className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold">
                                {activeModalItem.isHidden
                                  ? 'Biểu mẫu này đang: Không hiển thị (Tạm ẩn)'
                                  : 'Biểu mẫu này đang: Hiển thị công khai'}
                              </span>
                              <div className="text-[11px] opacity-80 mt-0.5">
                                {activeModalItem.isHidden
                                  ? 'Chỉ có Admin mới thấy biểu mẫu này. Người dùng thông thường sẽ không nhìn thấy.'
                                  : 'Tất cả mọi người đều có thể tìm kiếm, xem trước và tải biểu mẫu này.'}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleItemVisibility(activeModalItem)}
                            disabled={togglingItemId === activeModalItem.id}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-xs shrink-0 ${
                              activeModalItem.isHidden
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                          >
                            {activeModalItem.isHidden ? 'Mở hiển thị' : 'Ẩn biểu mẫu'}
                          </button>
                        </div>
                      )}

                      <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5">
                        <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1.5 flex items-center justify-between">
                          <span>Tóm tắt & Mục đích sử dụng</span>
                          {effectiveAdmin && (
                            <button
                              onClick={() => startEditInfo(activeModalItem)}
                              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 hover:underline"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Chỉnh sửa</span>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {activeModalItem.description}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 text-sm">
                        {(activeModalItem.highlights && activeModalItem.highlights.length > 0
                          ? activeModalItem.highlights
                          : [
                              `Áp dụng chuẩn quy định pháp luật năm ${activeModalItem.year}.`,
                              `Bảo toàn 100% công thức tính toán tự động trong bảng tính ${activeModalItem.fileType ? activeModalItem.fileType.toUpperCase() : 'Excel'}.`,
                              `Sẵn sàng chỉnh sửa, in ấn và áp dụng ngay cho doanh nghiệp.`
                            ]
                        ).map((hl, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-gray-600 dark:text-gray-300 leading-relaxed">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>

                      {/* Google Sheets / Docs Online Integration Box */}
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            activeModalItem.fileType === 'docx'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          }`}>
                            {activeModalItem.fileType === 'docx' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <FileSpreadsheet className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <span>Mẫu trực tuyến {activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'}</span>
                              {activeModalItem.googleSheetUrl || activeModalItem.googleDocUrl ? (
                                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                  Đã gắn link riêng
                                </span>
                              ) : (
                                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  Google Docs Viewer mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 font-mono text-[11px]">
                              {activeModalItem.googleSheetUrl || activeModalItem.googleDocUrl || getGoogleOnlineUrl(activeModalItem)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <a
                            href={getGoogleOnlineUrl(activeModalItem)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-50 flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <span>Mở trực tuyến</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          {effectiveAdmin && (
                            <button
                              onClick={() => openGoogleModal(activeModalItem)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all"
                              title="Cài đặt đường dẫn Google Sheets / Google Docs (Modal)"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Cài đặt Link</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activeModalItem.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-2">
                          <span className="text-xs text-gray-400">Từ khóa liên quan:</span>
                          {activeModalItem.tags.map((t, idx) => (
                            <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-lg">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-400 hidden sm:inline">
                Tệp: <strong className="text-gray-600 dark:text-gray-300">{activeModalItem.filename}</strong>
              </span>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <a
                  href={getGoogleOnlineUrl(activeModalItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 ${
                    activeModalItem.fileType === 'docx'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  title={`Mở và làm việc trực tuyến trên ${activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'}`}
                >
                  {activeModalItem.fileType === 'docx' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>
                    Mở {activeModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} (Chỉ xem)
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {effectiveAdmin && (
                  <button
                    onClick={() => openGoogleModal(activeModalItem)}
                    className="p-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 transition-colors"
                    title="Cài đặt link Google Sheets / Docs trực tuyến (Modal)"
                  >
                    <Pencil className="w-4 h-4 text-emerald-600" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDownload(activeModalItem, e)}
                  className="bg-[#e67e22] hover:bg-[#d35400] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
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

      {/* 8. MODAL CÀI ĐẶT LINK GOOGLE SHEETS / GOOGLE DOCS TRỰC TUYẾN (DÀNH CHO ADMIN) */}
      {googleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setGoogleModalItem(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveGoogleModal} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  googleModalItem.fileType === 'docx' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' 
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {googleModalItem.fileType === 'docx' ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                </div>
                <div className="pr-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-50 leading-snug">
                    Cài đặt Link {googleModalItem.fileType === 'docx' ? 'Google Docs' : 'Google Sheets'} trực tuyến
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    Biểu mẫu: <strong className="text-gray-800 dark:text-gray-200">{googleModalItem.title}</strong>
                  </p>
                </div>
              </div>

              {/* Hướng dẫn cài đặt quyền CHỈ CHO XEM (View-Only) */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quyền truy cập CHỈ CHO XEM (Chống chỉnh sửa mẫu gốc):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-300 text-[11px]">
                  <li>Mở file trên Google Drive → Bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải.</li>
                  <li>Tại mục <em>Quyền truy cập chung</em>, chọn <strong>Bất kỳ ai có đường liên kết</strong> và chọn vai trò là <strong>Người xem (Viewer)</strong> (TUYỆT ĐỐI không chọn Người chỉnh sửa).</li>
                  <li>Dán đường link vào ô bên dưới. Hệ thống sẽ <strong>tự động tối ưu sang chế độ Chỉ Xem (/preview)</strong> để người dùng chỉ xem được, không thể sửa hay xóa dữ liệu trong file của bạn.</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Đường dẫn liên kết Google trực tuyến:
                  </label>
                  {googleModalUrl && (
                    <button
                      type="button"
                      onClick={() => setGoogleModalUrl('')}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                    >
                      Xóa link
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={googleModalUrl}
                  onChange={(e) => setGoogleModalUrl(e.target.value)}
                  placeholder={
                    googleModalItem.fileType === 'docx'
                      ? 'https://docs.google.com/document/d/.../preview'
                      : 'https://docs.google.com/spreadsheets/d/.../preview'
                  }
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  * Hệ thống tự động chuyển đổi mọi link Google Docs/Sheets sang chế độ Chỉ Xem (View-Only /preview).
                </p>
              </div>

              {googleModalUrl.trim() && (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Link Chế Độ Chỉ Xem tự động tạo:
                    </span>
                    <a
                      href={toGoogleViewOnlyUrl(googleModalUrl.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Mở thử ↗</span>
                    </a>
                  </div>
                  <p className="text-gray-500 font-mono text-[11px] truncate">
                    {toGoogleViewOnlyUrl(googleModalUrl.trim())}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setGoogleModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingGoogleModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  {isSavingGoogleModal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu liên kết</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
