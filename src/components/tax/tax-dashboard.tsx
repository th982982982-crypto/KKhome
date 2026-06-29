'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { TaxUploadWidget } from './tax-upload-widget'
import { TaxTable } from './tax-table'
import { TaxAuditBalPanel, TaxAuditRevPanel } from './tax-audit-panel'
import type { TaxDataRow } from '@/lib/supabase/types'
import type { GtgtAuditResult, RevenueAuditResult } from '@/lib/tax/audit-engine'
import type { DeclarationType } from '@/lib/tax/ui-config'

type Tab = 'GTGT' | 'TNDN' | 'TNCN' | 'AUDIT_BAL' | 'AUDIT_REV'
type Mode = 'year' | 'period'

export function TaxDashboard() {
  const [rows, setRows] = useState<TaxDataRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('GTGT')
  const [mode, setMode] = useState<Mode>('year')
  const [selectedMst, setSelectedMst] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')

  const [auditData, setAuditData] = useState<{
    gtgtAudit: GtgtAuditResult[]
    revenueAudit: RevenueAuditResult[]
  } | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)

  const mstList = [...new Set(rows.map((r) => r.mst))].sort()
  const yearList = [...new Set(rows.map((r) => r.tax_year))].sort((a, b) => parseInt(b) - parseInt(a))

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tax/data')
      if (!res.ok) throw new Error('Tải dữ liệu thất bại')
      const json = await res.json()
      setRows(json.rows ?? [])
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

  const isAuditTab = tab === 'AUDIT_BAL' || tab === 'AUDIT_REV'

  return (
    <div>
      {/* Upload widget */}
      <TaxUploadWidget onUploaded={fetchData} />

      {/* Alert banner */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border-l-4 border-amber-500 px-4 py-3 rounded-r-lg shadow-sm mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Cảnh báo đối soát</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hệ thống tự động phát hiện sai lệch số liệu kế toán liên kỳ. Chọn tab Rủi ro để xem chi tiết.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedMst}
            onChange={(e) => handleMstChange(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none"
          >
            <option value="all">Tất cả MST</option>
            {mstList.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

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

          <button
            onClick={fetchData}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
          </button>
        ))}
      </div>

      {/* Mode toggle + content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">{error}</div>
      ) : (
        <>
          {!isAuditTab && (
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

          {tab === 'GTGT' && (
            <TaxTable rows={rows} declarationType="GTGT" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />
          )}
          {tab === 'TNDN' && (
            <TaxTable rows={rows} declarationType="TNDN" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />
          )}
          {tab === 'TNCN' && (
            <TaxTable rows={rows} declarationType="TNCN" selectedMst={selectedMst} selectedYear={selectedYear} mode={mode} />
          )}
          {tab === 'AUDIT_BAL' && (
            <div>
              {selectedMst === 'all' ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <p className="font-semibold">Chọn một MST cụ thể để chạy đối soát</p>
                </div>
              ) : auditLoading ? (
                <div className="text-center py-16 text-gray-400">Đang phân tích...</div>
              ) : (
                <TaxAuditBalPanel data={auditData?.gtgtAudit ?? []} mst={selectedMst} />
              )}
            </div>
          )}
          {tab === 'AUDIT_REV' && (
            <div>
              {selectedMst === 'all' ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <p className="font-semibold">Chọn một MST cụ thể để chạy đối soát</p>
                </div>
              ) : auditLoading ? (
                <div className="text-center py-16 text-gray-400">Đang phân tích...</div>
              ) : (
                <TaxAuditRevPanel data={auditData?.revenueAudit ?? []} mst={selectedMst} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
