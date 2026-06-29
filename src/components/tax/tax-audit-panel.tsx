'use client'

import type { GtgtAuditResult, RevenueAuditResult } from '@/lib/tax/audit-engine'

function fmt(v: number) {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

function AuditBadge({ diff }: { diff: number }) {
  if (diff === 0)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">Khớp số liệu</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse">Có chênh lệch</span>
}

export function TaxAuditBalPanel({ data }: { data: GtgtAuditResult[] }) {
  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Cần ít nhất 2 kỳ GTGT liên tiếp để đối soát</p>
    </div>
  )

  return (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TaxAuditRevPanel({ data }: { data: RevenueAuditResult[] }) {
  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Cần có cả tờ khai GTGT và TNDN cùng năm để đối soát</p>
    </div>
  )

  return (
    <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900">
            <th className="text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Năm</th>
            <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Tổng DT GTGT [34]</th>
            <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">DT TNDN [04]</th>
            <th className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Chênh lệch</th>
            <th className="text-center px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Trạng thái</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
