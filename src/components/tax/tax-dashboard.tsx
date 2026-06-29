'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle, Download, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { TaxUploadWidget } from './tax-upload-widget'
import { TaxTable } from './tax-table'
import { TaxAuditBalPanel, TaxAuditRevPanel } from './tax-audit-panel'
import type { TaxFile } from '@/lib/supabase/types'
import { UI_CONFIG } from '@/lib/tax/ui-config'
import type { GtgtAuditResult, RevenueAuditResult } from '@/lib/tax/audit-engine'

type Tab = 'GTGT' | 'TNDN' | 'TNCN' | 'AUDIT_BAL' | 'AUDIT_REV' | 'FILES'
type Mode = 'year' | 'period'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function TaxDashboard() {
  const [files, setFiles] = useState<TaxFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('GTGT')
  const [mode, setMode] = useState<Mode>('year')
  const [selectedMst, setSelectedMst] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const [auditData, setAuditData] = useState<{
    gtgtAudit: GtgtAuditResult[]
    revenueAudit: RevenueAuditResult[]
  } | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)

  // Derive MST list with company names from active files
  const mstMap = new Map<string, string>()
  for (const f of files) {
    if (f.status === 'ĐƯỢC CỘNG' && !mstMap.has(f.mst)) {
      mstMap.set(f.mst, f.ten_nnt ?? '')
    }
  }
  const mstList = [...mstMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const yearList = [...new Set(files.filter(f => f.status === 'ĐƯỢC CỘNG').map((f) => f.tax_year))].sort(
    (a, b) => parseInt(b) - parseInt(a)
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tax/data')
      if (!res.ok) throw new Error('Tải dữ liệu thất bại')
      const json = await res.json()
      setFiles(json.files ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function fetchAudit(mst: string) {
    if (mst === 'all') { setAuditData(null); return }
    setAuditLoading(true)
    try {
      const res = await fetch(`/api/tax/audit?mst=${encodeURIComponent(mst)}`)
      const json = await res.json()
      setAuditData(json)
    } catch {
      setAuditData(null)
    } finally {
      setAuditLoading(false)
    }
  }

  function handleMstChange(mst: string) {
    setSelectedMst(mst)
    if (tab === 'AUDIT_BAL' || tab === 'AUDIT_REV') fetchAudit(mst)
  }

  function handleTabChange(t: Tab) {
    setTab(t)
    if ((t === 'AUDIT_BAL' || t === 'AUDIT_REV') && selectedMst !== 'all') fetchAudit(selectedMst)
  }

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`Xoá file "${fileName}"?\n\nNếu đây là phiên bản hiện tại, phiên bản trước sẽ được khôi phục.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/tax/files/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xoá thất bại')
      toast.success('Đã xoá file')
      fetchData()
    } catch {
      toast.error('Xoá thất bại')
    } finally {
      setDeletingId(null)
    }
  }

  function handleExcelExport() {
    const wb = XLSX.utils.book_new()
    const types: Array<'GTGT' | 'TNDN' | 'TNCN'> = ['GTGT', 'TNDN', 'TNCN']

    for (const dtype of types) {
      const cfg = UI_CONFIG[dtype]
      const filtered = files.filter(
        (f) =>
          f.declaration_type === dtype &&
          f.status === 'ĐƯỢC CỘNG' &&
          (selectedMst === 'all' || f.mst === selectedMst) &&
          (selectedYear === 'all' || f.tax_year === selectedYear)
      ).sort((a, b) => a.tax_year.localeCompare(b.tax_year) || a.tax_period.localeCompare(b.tax_period))

      if (!filtered.length) continue

      // Pivot: sum by mst+year
      const years = [...new Set(filtered.map((f) => f.tax_year))].sort()
      const pivot: Record<string, Record<string, number>> = {}
      for (const f of filtered) {
        const key = `${f.mst}\n${f.tax_year}`
        if (!pivot[key]) pivot[key] = {}
        for (const [code, val] of Object.entries(f.indicators)) {
          pivot[key][code] = (pivot[key][code] ?? 0) + val
        }
      }
      const colKeys = [...new Set(filtered.map(f => `${f.mst}\n${f.tax_year}`))]

      const header = ['Chỉ tiêu', 'Mã', ...colKeys.map(k => {
        const [mst, yr] = k.split('\n')
        return mstMap.get(mst) ? `${mst} — ${yr}` : `${mst} — ${yr}`
      })]
      const rows: (string | number)[][] = [header]

      for (const row of cfg) {
        if (row.isHeader) {
          rows.push([row.name, '', ...colKeys.map(() => '')])
        } else {
          rows.push([
            row.name,
            `[${row.code}]`,
            ...colKeys.map(k => pivot[k]?.[row.code] ?? 0),
          ])
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 50 }, { wch: 8 }, ...colKeys.map(() => ({ wch: 18 }))]
      XLSX.utils.book_append_sheet(wb, ws, dtype)
    }

    const mstLabel = selectedMst === 'all' ? 'TatCa' : selectedMst
    const yearLabel = selectedYear === 'all' ? 'TatCaNam' : selectedYear
    XLSX.writeFile(wb, `TorKhai_${mstLabel}_${yearLabel}.xlsx`)
    toast.success('Đã xuất Excel')
  }

  const isAuditTab = tab === 'AUDIT_BAL' || tab === 'AUDIT_REV'
  const hasActiveData = files.some(f => f.status === 'ĐƯỢC CỘNG')

  return (
    <div>
      <TaxUploadWidget onUploaded={fetchData} />

      {hasActiveData && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border-l-4 border-amber-500 px-4 py-3 rounded-r-lg shadow-sm mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Cảnh báo đối soát</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hệ thống tự động phát hiện sai lệch số liệu liên kỳ. Chọn tab Rủi ro để xem chi tiết.</p>
          </div>
        </div>
      )}

      {hasActiveData && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* MST selector with company name */}
          <select
            value={selectedMst}
            onChange={(e) => handleMstChange(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none max-w-xs"
          >
            <option value="all">Tất cả MST</option>
            {mstList.map(([mst, name]) => (
              <option key={mst} value={mst}>
                {mst}{name ? ` — ${name}` : ''}
              </option>
            ))}
          </select>

          {/* Year filter */}
          <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2">Năm</span>
            <button
              onClick={() => setSelectedYear('all')}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${selectedYear === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Tất cả
            </button>
            {yearList.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${selectedYear === y ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!isAuditTab && tab !== 'FILES' && (
              <button
                onClick={handleExcelExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 gap-1 overflow-x-auto">
        {([
          { id: 'GTGT', label: 'Báo cáo GTGT' },
          { id: 'TNDN', label: 'Báo cáo TNDN' },
          { id: 'TNCN', label: 'Báo cáo TNCN' },
          { id: 'AUDIT_BAL', label: 'Rủi ro Số dư GTGT', danger: true },
          { id: 'AUDIT_REV', label: 'Rủi ro Doanh thu', danger: true },
          { id: 'FILES', label: 'Lịch sử tải lên' },
        ] as { id: Tab; label: string; danger?: boolean }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === t.id
                ? t.danger ? 'text-red-600 border-red-500' : 'text-blue-600 dark:text-blue-400 border-blue-500'
                : t.danger
                  ? 'text-red-400 border-transparent hover:text-red-600'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
            {t.id === 'FILES' && files.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {files.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">{error}</div>
      ) : (
        <>
          {!isAuditTab && tab !== 'FILES' && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setMode('year')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${mode === 'year' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Nhóm theo năm
              </button>
              <button
                onClick={() => setMode('period')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors ${mode === 'period' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Xem chi tiết kỳ
              </button>
            </div>
          )}

          {tab === 'GTGT' && <TaxTable files={files} declarationType="GTGT" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />}
          {tab === 'TNDN' && <TaxTable files={files} declarationType="TNDN" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />}
          {tab === 'TNCN' && <TaxTable files={files} declarationType="TNCN" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />}

          {tab === 'AUDIT_BAL' && (
            selectedMst === 'all' ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-semibold">Chọn một MST cụ thể để chạy đối soát</div>
            ) : auditLoading ? (
              <div className="text-center py-16 text-gray-400">Đang phân tích...</div>
            ) : (
              <TaxAuditBalPanel data={auditData?.gtgtAudit ?? []} />
            )
          )}
          {tab === 'AUDIT_REV' && (
            selectedMst === 'all' ? (
              <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-semibold">Chọn một MST cụ thể để chạy đối soát</div>
            ) : auditLoading ? (
              <div className="text-center py-16 text-gray-400">Đang phân tích...</div>
            ) : (
              <TaxAuditRevPanel data={auditData?.revenueAudit ?? []} />
            )
          )}

          {tab === 'FILES' && <FileList files={files} deletingId={deletingId} onDelete={handleDelete} />}
        </>
      )}
    </div>
  )
}

function FileList({
  files,
  deletingId,
  onDelete,
}: {
  files: TaxFile[]
  deletingId: string | null
  onDelete: (id: string, name: string) => void
}) {
  const [showReplaced, setShowReplaced] = useState(false)

  const active = files.filter(f => f.status === 'ĐƯỢC CỘNG')
  const replaced = files.filter(f => f.status === 'THAY THẾ')

  if (!files.length) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-semibold">Chưa có file nào được tải lên</p>
        <p className="text-sm mt-1">Upload file XML tờ khai thuế để bắt đầu</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active files */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Đang sử dụng ({active.length} file)</span>
        </div>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 font-semibold">
              <th className="text-left px-4 py-2 border-b border-gray-100 dark:border-gray-800">Tên file</th>
              <th className="text-left px-4 py-2 border-b border-gray-100 dark:border-gray-800">MST / Công ty</th>
              <th className="text-left px-4 py-2 border-b border-gray-100 dark:border-gray-800">Loại / Kỳ</th>
              <th className="text-left px-4 py-2 border-b border-gray-100 dark:border-gray-800">Ngày upload</th>
              <th className="px-4 py-2 border-b border-gray-100 dark:border-gray-800"></th>
            </tr>
          </thead>
          <tbody>
            {active.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 break-all">{f.file_name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">{f.mst}</div>
                  {f.ten_nnt && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 max-w-[200px] truncate">{f.ten_nnt}</div>}
                </td>
                <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md mr-1.5 ${
                    f.declaration_type === 'GTGT' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                    f.declaration_type === 'TNDN' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' :
                    'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                  }`}>{f.declaration_type}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{f.tax_period}</span>
                </td>
                <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {fmtDate(f.uploaded_at)}
                </td>
                <td className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-right">
                  <button
                    onClick={() => onDelete(f.id, f.file_name)}
                    disabled={deletingId === f.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                    title="Xoá file này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Replaced files (collapsible) */}
      {replaced.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowReplaced(!showReplaced)}
            className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Đã thay thế ({replaced.length} file)</span>
            {showReplaced ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showReplaced && (
            <table className="min-w-full border-collapse text-sm">
              <tbody>
                {replaced.map(f => (
                  <tr key={f.id} className="opacity-60 hover:opacity-80 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 break-all">{f.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400">{f.mst}</td>
                    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400">{f.declaration_type} · {f.tax_period}</td>
                    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 whitespace-nowrap">{fmtDate(f.uploaded_at)}</td>
                    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-right">
                      <button
                        onClick={() => onDelete(f.id, f.file_name)}
                        disabled={deletingId === f.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                        title="Xoá vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
