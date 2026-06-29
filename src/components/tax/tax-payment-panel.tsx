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

export function TaxPaymentPanel() {
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedMst, setSelectedMst] = useState('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tax/payments')
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
        const json = await res.json()
        if (!res.ok) { toast.error(`${file.name}: ${json.error}`); fail++ }
        else ok++
      } catch {
        fail++
      }
    }
    if (ok) toast.success(`Đã tải lên ${ok} giấy nộp tiền`)
    if (fail) toast.error(`${fail} file thất bại`)
    setUploading(false)
    fetchPayments()
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

    const rows: (string | number | null)[][] = [
      ['Ngày lập', 'MST', 'Công ty', 'Hình thức', 'Tổng tiền', 'Ngân hàng', 'Số tài khoản', 'Mã tham chiếu', 'Khoản nộp', 'Kỳ thuế', 'Số tiền', 'Ghi chú'],
    ]
    for (const p of data) {
      const base: (string | number | null)[] = [
        fmtDate(p.ngay_lap), p.mst, p.ten_nnop, p.hthuc_nop === 'CK' ? 'Chuyển khoản' : 'Tiền mặt',
        p.tong_tien, p.ten_nhang_nop, p.stk_nhang_nop, p.ma_thamchieu,
      ]
      if (p.chi_tiet.length === 0) {
        rows.push([...base, '', '', '', ''])
      } else {
        for (const ct of p.chi_tiet) {
          rows.push([...base, ct.ndungNop, ct.kyThue, ct.tienPnop, ct.ghiChu])
        }
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [8,12,30,12,14,30,18,20,40,12,14,20].map(w => ({ wch: w }))
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
              <option key={mst} value={mst}>{mst}{name ? ` — ${name}` : ''}</option>
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
                      <td colSpan={8} className="bg-blue-50 dark:bg-blue-950/10 border-b border-gray-200 dark:border-gray-700 px-8 py-3">
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
