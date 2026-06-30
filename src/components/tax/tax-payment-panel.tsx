'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Trash2, ChevronDown, ChevronRight, RefreshCw, FileCheck, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import type { TaxPayment } from '@/lib/supabase/types'

function fmtMoney(v: number | null) {
  if (!v) return '—'
  return v.toLocaleString('vi-VN') + ' ₫'
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  // s is "2025-07-14"
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function HthucBadge({ code }: { code: string | null }) {
  if (code === 'CK') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">Chuyển khoản</span>
  if (code === 'TM') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">Tiền mặt</span>
  return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600">{code ?? '—'}</span>
}

// Map mã tiểu mục NSNN → tên loại thuế
const MA_NDKT_MAP: Record<string, string> = {
  '1001': 'GTGT', '1002': 'GTGT XK', '1003': 'GTGT NK',
  '1004': 'TNDN', '1005': 'TNDN BS',
  '1006': 'Tài nguyên', '1007': 'Tài nguyên',
  '1009': 'Tài nguyên',
  '1010': 'Đất', '1011': 'Nhà đất', '1013': 'Đất',
  '1014': 'Môn bài',
  '1015': 'Chuyển QSD đất',
  '1021': 'TTĐB', '1050': 'TTĐB NK',
  '1052': 'Bảo vệ MT',
  '1100': 'XNK', '1101': 'Nhập khẩu', '1102': 'Xuất khẩu',
  '1503': 'TNCN',
  '2050': 'Phạt CN', '2051': 'Phạt CN', '2052': 'Phạt CN',
  '4200': 'Hoàn thuế',
}

// Detect tax type from nội dung nộp text (keyword) hoặc mã tiểu mục
function detectTaxType(ndung: string, maNdkt?: string): string {
  const s = ndung.toLowerCase()
  if (s.includes('giá trị gia tăng') || s.includes('gtgt')) return 'GTGT'
  if (s.includes('thu nhập doanh nghiệp') || s.includes('tndn')) return 'TNDN'
  if (s.includes('thu nhập cá nhân') || s.includes('tncn')) return 'TNCN'
  if (s.includes('môn bài') || s.includes('mon bai') || s.includes('mba')) return 'Môn bài'
  if (s.includes('tiêu thụ đặc biệt') || s.includes('ttdb')) return 'TTĐB'
  if (s.includes('xuất khẩu') || s.includes('nhập khẩu')) return 'XNK'
  if (s.includes('chậm nộp') || s.includes('cham nop') || s.includes('phạt')) return 'Phạt CN'
  // Fallback to mã tiểu mục NSNN
  if (maNdkt && MA_NDKT_MAP[maNdkt]) return MA_NDKT_MAP[maNdkt]
  return ''
}

const TAX_TYPE_COLOR: Record<string, string> = {
  GTGT:       'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
  'GTGT XK':  'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  'GTGT NK':  'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  TNDN:       'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  'TNDN BS':  'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  TNCN:       'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  'Môn bài':  'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  'Phạt CN':  'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  TTĐB:       'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
  'TTĐB NK':  'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
  XNK:        'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
  'Nhập khẩu':'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
  'Xuất khẩu':'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
  'Tài nguyên':'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
  'Bảo vệ MT':'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  'Hoàn thuế':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
}

function KhoanNopBadges({ chiTiet }: { chiTiet: TaxPayment['chi_tiet'] }) {
  if (!chiTiet.length) return <span className="text-gray-300 dark:text-gray-600">—</span>
  // Deduplicate by (taxType, kyThue)
  const seen = new Set<string>()
  const items: { taxType: string; kyThue: string }[] = []
  for (const ct of chiTiet) {
    const taxType = detectTaxType(ct.ndungNop, ct.maNdkt) || ct.maNdkt || '?'
    const key = `${taxType}|${ct.kyThue}`
    if (!seen.has(key)) { seen.add(key); items.push({ taxType, kyThue: ct.kyThue }) }
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(({ taxType, kyThue }, i) => (
        <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${TAX_TYPE_COLOR[taxType] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
          {taxType}{kyThue ? ` ${kyThue}` : ''}
        </span>
      ))}
    </div>
  )
}

export function TaxPaymentPanel() {
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedMst, setSelectedMst] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tax/payments')
      if (!res.ok) throw new Error('Failed to fetch payments')
      const json = await res.json()
      setPayments(json.payments ?? [])
    } catch {
      toast.error('Tải dữ liệu thất bại')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return
    setUploading(true)
    let ok = 0, fail = 0
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/tax/payments/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          toast.error(`${file.name}: ${(json as {error?: string}).error ?? 'Upload thất bại'}`)
          fail++
        } else {
          ok++
        }
      } catch {
        fail++
      }
    }
    if (ok) toast.success(`Đã tải lên ${ok} giấy nộp tiền`)
    if (fail) toast.error(`${fail} file thất bại`)
    setUploading(false)
    fetchPayments()
  }

  async function handleDeleteAll() {
    if (!confirm(`Xóa toàn bộ ${payments.length} giấy nộp tiền?\n\nHành động này không thể hoàn tác.`)) return
    setDeletingAll(true)
    try {
      const res = await fetch('/api/tax/payments', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Đã xóa toàn bộ ${payments.length} giấy nộp tiền`)
      fetchPayments()
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setDeletingAll(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá giấy nộp tiền này?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/tax/payments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Đã xoá')
      fetchPayments()
    } catch {
      toast.error('Xoá thất bại')
    } finally {
      setDeletingId(null)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function exportExcel() {
    const data = filtered
    if (!data.length) { toast.error('Không có dữ liệu để xuất'); return }

    // Flatten each GNT → chi_tiet rows, keeping original GNT STT (by date order)
    type FlatRow = {
      stt: number
      ngayLap: string | null
      mst: string
      tenNNop: string | null
      maThamChieu: string | null
      ndungNop: string
      maNdkt: string
      kyThue: string
      tienPnop: number
    }
    const flat: FlatRow[] = []
    data.forEach((p, idx) => {
      const stt = idx + 1
      if (!p.chi_tiet.length) {
        flat.push({ stt, ngayLap: p.ngay_lap, mst: p.mst, tenNNop: p.ten_nnop, maThamChieu: p.ma_thamchieu, ndungNop: '', maNdkt: '', kyThue: '', tienPnop: p.tong_tien ?? 0 })
      } else {
        for (const ct of p.chi_tiet) {
          flat.push({ stt, ngayLap: p.ngay_lap, mst: p.mst, tenNNop: p.ten_nnop, maThamChieu: p.ma_thamchieu, ndungNop: ct.ndungNop, maNdkt: ct.maNdkt, kyThue: ct.kyThue, tienPnop: ct.tienPnop })
        }
      }
    })

    // Group by maNdkt, preserving insertion order
    const groupMap = new Map<string, FlatRow[]>()
    for (const row of flat) {
      const key = row.maNdkt || '__other'
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(row)
    }

    // Build Excel rows
    const wsData: (string | number | null)[][] = [
      ['STT', 'Ngày lập', 'Mã số thuế', 'Công ty', 'Mã tham chiếu', 'Loại thuế (Nội dung kinh tế)', 'Mã NDKT', 'Kỳ thuế', 'Số tiền nộp'],
    ]
    let grandTotal = 0
    for (const [ndkt, rows] of groupMap) {
      // Group header row: derive description from first row's ndungNop
      const desc = rows.find(r => r.ndungNop)?.ndungNop ?? ''
      const groupLabel = ndkt !== '__other'
        ? `${desc}${desc ? ' ' : ''}(Tiểu mục ${ndkt})`
        : 'Không xác định loại thuế'
      wsData.push([groupLabel, '', '', '', '', '', '', '', ''])

      for (const r of rows) {
        wsData.push([r.stt, fmtDate(r.ngayLap), r.mst, r.tenNNop ?? '', r.maThamChieu ?? '', r.ndungNop, ndkt !== '__other' ? ndkt : '', r.kyThue, r.tienPnop])
        grandTotal += r.tienPnop
      }
    }
    wsData.push(['Tổng', '', '', '', '', '', '', '', grandTotal])

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Bold group header rows and total row
    const headerRows = new Set<number>()
    let ri = 1 // 0-indexed, row 0 = column headers
    for (const [, rows] of groupMap) {
      headerRows.add(ri) // group header
      ri += 1 + rows.length
    }
    headerRows.add(ri) // total row
    for (const r of headerRows) {
      for (let c = 0; c < 9; c++) {
        const cell = XLSX.utils.encode_cell({ r, c })
        if (ws[cell]) ws[cell].s = { font: { bold: true } }
      }
    }

    ws['!cols'] = [6, 12, 14, 30, 22, 42, 10, 12, 16].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Giấy nộp tiền')
    XLSX.writeFile(wb, `GiayNopTien_${selectedMst === 'all' ? 'TatCa' : selectedMst}.xlsx`)
    toast.success('Đã xuất Excel')
  }

  const mstMap = new Map<string, string>()
  for (const p of payments) if (!mstMap.has(p.mst)) mstMap.set(p.mst, p.ten_nnop ?? '')
  const mstList = [...mstMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  const filtered = payments.filter(p => selectedMst === 'all' || p.mst === selectedMst)
  const totalFiltered = filtered.reduce((s, p) => s + (p.tong_tien ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <input ref={inputRef} type="file" accept=".xml" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <Upload className={`w-8 h-8 mx-auto mb-2 ${uploading ? 'text-blue-500 animate-bounce' : 'text-gray-400'}`} />
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {uploading ? 'Đang tải lên...' : 'Kéo thả hoặc click để chọn file XML Giấy nộp tiền'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Hỗ trợ nhiều file cùng lúc</p>
      </div>

      {/* Filters + export */}
      {payments.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMst}
            onChange={e => setSelectedMst(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none max-w-xs"
          >
            <option value="all">Tất cả MST</option>
            {mstList.map(([mst, name]) => (
              <option key={mst} value={mst}>{name ? `${name} (${mst})` : mst}</option>
            ))}
          </select>

          {filtered.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-800 dark:text-gray-100">{filtered.length}</span> phiếu ·{' '}
              Tổng: <span className="font-bold text-blue-600 dark:text-blue-400">{fmtMoney(totalFiltered)}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {deletingAll ? 'Đang xóa...' : `Xóa tất cả (${payments.length})`}
            </button>
            <button onClick={fetchPayments} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" title="Làm mới">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Chưa có giấy nộp tiền nào</p>
          <p className="text-sm mt-1">Upload file XML từ cổng thuế điện tử</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                <th className="w-8 px-3 py-3 border-b border-gray-200 dark:border-gray-700"></th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Ngày lập</th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">MST / Công ty</th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Khoản nộp</th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Hình thức</th>
                <th className="text-right px-4 py-3 border-b border-gray-200 dark:border-gray-700">Tổng tiền</th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Ngân hàng</th>
                <th className="text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700">Mã tham chiếu</th>
                <th className="px-3 py-3 border-b border-gray-200 dark:border-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <Fragment key={p.id}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleExpand(p.id)}
                  >
                    <td className="px-3 py-3 border-b border-gray-100 dark:border-gray-800 text-gray-400">
                      {expanded.has(p.id)
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-xs whitespace-nowrap">
                      {fmtDate(p.ngay_lap)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{p.mst}</div>
                      {p.ten_nnop && <div className="text-[11px] text-gray-400 mt-0.5 max-w-[200px] truncate">{p.ten_nnop}</div>}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 max-w-[200px]">
                      <KhoanNopBadges chiTiet={p.chi_tiet} />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <HthucBadge code={p.hthuc_nop} />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {fmtMoney(p.tong_tien)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                      <div>{p.ten_nhang_nop}</div>
                      {p.stk_nhang_nop && <div className="font-mono text-[11px] text-gray-400">{p.stk_nhang_nop}</div>}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-xs text-gray-400">
                      {p.ma_thamchieu ?? '—'}
                    </td>
                    <td className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                        disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded detail rows */}
                  {expanded.has(p.id) && p.chi_tiet.length > 0 && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={9} className="bg-blue-50 dark:bg-blue-950/10 border-b border-gray-200 dark:border-gray-700 px-8 py-3">
                        <table className="min-w-full text-xs border-collapse">
                          <thead>
                            <tr className="text-gray-500 dark:text-gray-400 font-semibold">
                              <th className="text-left pb-1.5 pr-4">Nội dung nộp</th>
                              <th className="text-left pb-1.5 pr-4">Kỳ thuế</th>
                              <th className="text-left pb-1.5 pr-4">Mã NDKT</th>
                              <th className="text-left pb-1.5 pr-4">Chương</th>
                              <th className="text-right pb-1.5">Số tiền</th>
                              <th className="text-left pb-1.5 pl-4">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.chi_tiet.map((ct, i) => (
                              <tr key={i} className="border-t border-blue-100 dark:border-blue-900/30">
                                <td className="py-1.5 pr-4 text-gray-700 dark:text-gray-300">{ct.ndungNop}</td>
                                <td className="py-1.5 pr-4 font-mono text-gray-600 dark:text-gray-400">{ct.kyThue}</td>
                                <td className="py-1.5 pr-4 font-mono text-gray-500">{ct.maNdkt}</td>
                                <td className="py-1.5 pr-4 font-mono text-gray-500">{ct.maChuong}</td>
                                <td className="py-1.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{fmtMoney(ct.tienPnop)}</td>
                                <td className="py-1.5 pl-4 text-gray-400">{ct.ghiChu}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
