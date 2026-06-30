'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { GtgtAuditResult, RevenueAuditResult } from '@/lib/tax/audit-engine'

function fmt(v: number) {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

function fmtNum(v: number) {
  return v || 0
}

function AuditBadge({ diff }: { diff: number }) {
  if (diff === 0)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">Khớp số liệu</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse">Có chênh lệch</span>
}

const NOTE_KEY_BAL = 'kk_audit_bal_notes'
const NOTE_KEY_REV = 'kk_audit_rev_notes'

export function TaxAuditBalPanel({ data }: { data: GtgtAuditResult[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTE_KEY_BAL)
      if (saved) setNotes(JSON.parse(saved))
    } catch {}
  }, [])

  function updateNote(keyId: string, val: string) {
    const next = { ...notes, [keyId]: val }
    setNotes(next)
    try { localStorage.setItem(NOTE_KEY_BAL, JSON.stringify(next)) } catch {}
  }

  function exportExcel() {
    const rows: (string | number)[][] = [
      ['Kỳ J', 'Kỳ J+1', 'ct[43] kỳ J', 'ct[22] kỳ J+1', 'Chênh lệch', 'Trạng thái', 'Ghi chú chênh lệch'],
      ...data.map((r) => [
        r.periodJ,
        r.periodJ1,
        fmtNum(r.val43),
        fmtNum(r.val22),
        Math.abs(r.diff),
        r.status,
        notes[r.keyId] ?? '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 28 }, { wch: 50 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rủi ro Số dư')
    XLSX.writeFile(wb, 'RuiRoSoDuGTGT.xlsx')
  }

  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Cần ít nhất 2 kỳ GTGT liên tiếp để đối soát</p>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>
      <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Kỳ J</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Kỳ J+1</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">ct[43] kỳ J</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">ct[22] kỳ J+1</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Chênh lệch</th>
              <th className="text-center px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Trạng thái</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Ghi chú chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.keyId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-xs">{row.periodJ}</td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-xs">{row.periodJ1}</td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs">{fmt(row.val43)}</td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs">{fmt(row.val22)}</td>
                <td className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs font-bold ${row.diff !== 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {fmt(Math.abs(row.diff))}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-center">
                  <AuditBadge diff={row.diff} />
                </td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <input
                    type="text"
                    value={notes[row.keyId] ?? ''}
                    onChange={(e) => updateNote(row.keyId, e.target.value)}
                    placeholder={row.diff !== 0 ? 'Nhập giải thích chênh lệch...' : ''}
                    className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TaxAuditRevPanel({ data }: { data: RevenueAuditResult[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTE_KEY_REV)
      if (saved) setNotes(JSON.parse(saved))
    } catch {}
  }, [])

  function updateNote(keyId: string, val: string) {
    const next = { ...notes, [keyId]: val }
    setNotes(next)
    try { localStorage.setItem(NOTE_KEY_REV, JSON.stringify(next)) } catch {}
  }

  function exportExcel() {
    const rows: (string | number)[][] = [
      ['Năm', 'Tổng DT GTGT [34]', 'DT TNDN [04]', 'Chênh lệch', 'Trạng thái', 'Ghi chú chênh lệch'],
      ...data.map((r) => [
        r.year,
        fmtNum(r.val34),
        fmtNum(r.val04),
        Math.abs(r.diff),
        r.status,
        notes[r.keyId] ?? '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 8 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 50 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rủi ro Doanh thu')
    XLSX.writeFile(wb, 'RuiRoDoanhThu.xlsx')
  }

  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Cần có cả tờ khai GTGT và TNDN cùng năm để đối soát</p>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>
      <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Năm</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Tổng DT GTGT [34]</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">DT TNDN [04]</th>
              <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Chênh lệch</th>
              <th className="text-center px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Trạng thái</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Ghi chú chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.keyId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-bold">{row.year}</td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs">{fmt(row.val34)}</td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs">{fmt(row.val04)}</td>
                <td className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-right font-mono text-xs font-bold ${row.diff !== 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {fmt(Math.abs(row.diff))}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-center">
                  <AuditBadge diff={row.diff} />
                </td>
                <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <input
                    type="text"
                    value={notes[row.keyId] ?? ''}
                    onChange={(e) => updateNote(row.keyId, e.target.value)}
                    placeholder={row.diff !== 0 ? 'Nhập giải thích chênh lệch...' : ''}
                    className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
