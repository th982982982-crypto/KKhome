'use client'

import { useMemo } from 'react'
import { UI_CONFIG, type DeclarationType } from '@/lib/tax/ui-config'
import type { TaxDataRow } from '@/lib/supabase/types'

interface TaxTableProps {
  rows: TaxDataRow[]
  declarationType: DeclarationType
  selectedMst: string
  selectedYear: string
  mode: 'year' | 'period'
}

function fmt(v: number): string {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

export function TaxTable({ rows, declarationType, selectedMst, selectedYear, mode }: TaxTableProps) {
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.declaration_type === declarationType &&
          r.status === 'ĐƯỢC CỘNG' &&
          (selectedMst === 'all' || r.mst === selectedMst) &&
          (selectedYear === 'all' || r.tax_year === selectedYear)
      ),
    [rows, declarationType, selectedMst, selectedYear]
  )

  const config = UI_CONFIG[declarationType]

  if (mode === 'year') {
    const years = [...new Set(filtered.map((r) => r.tax_year))].sort((a, b) => parseInt(b) - parseInt(a))
    const mstList = selectedMst === 'all' ? [...new Set(filtered.map((r) => r.mst))] : [selectedMst]

    if (years.length === 0) return <Empty />

    const pivot: Record<string, Record<string, Record<string, number>>> = {}
    for (const r of filtered) {
      if (!pivot[r.mst]) pivot[r.mst] = {}
      if (!pivot[r.mst][r.tax_year]) pivot[r.mst][r.tax_year] = {}
      pivot[r.mst][r.tax_year][r.indicator_code] =
        (pivot[r.mst][r.tax_year][r.indicator_code] ?? 0) + r.value
    }

    return (
      <div className="overflow-auto max-h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900">
              <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-900 text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 min-w-[300px]">
                Chỉ tiêu
              </th>
              <th className="sticky left-[300px] z-30 bg-gray-50 dark:bg-gray-900 text-center px-3 py-3 font-bold text-gray-500 border-b border-r border-gray-200 dark:border-gray-700 min-w-[60px]">
                Mã
              </th>
              {mstList.map((mst) =>
                years.map((yr) => (
                  <th
                    key={`${mst}-${yr}`}
                    className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[130px]"
                  >
                    {mstList.length > 1 && <div className="text-[10px] text-gray-400">{mst}</div>}
                    {yr}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {config.map((row, i) => {
              if (row.isHeader) {
                return (
                  <tr key={i}>
                    <td
                      colSpan={2 + mstList.length * years.length}
                      className="sticky left-0 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 font-bold text-xs px-4 py-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide"
                    >
                      {row.name}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={row.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="sticky left-0 bg-white dark:bg-gray-950 px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-r border-gray-100 dark:border-gray-800 text-xs min-w-[300px]">
                    {row.name}
                  </td>
                  <td className="sticky left-[300px] bg-white dark:bg-gray-950 text-center px-3 py-2 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border-b border-r border-gray-100 dark:border-gray-800">
                    [{row.code}]
                  </td>
                  {mstList.map((mst) =>
                    years.map((yr) => {
                      const val = pivot[mst]?.[yr]?.[row.code] ?? 0
                      return (
                        <td
                          key={`${mst}-${yr}`}
                          className="text-right px-4 py-2 font-mono text-xs border-b border-r border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                        >
                          {fmt(val)}
                        </td>
                      )
                    })
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Period mode
  interface PeriodKey { period: string; mst: string; khaiType: string | null; soLan: string | null }
  const periodKeys: PeriodKey[] = []
  const seen = new Set<string>()
  for (const r of filtered) {
    const k = `${r.mst}||${r.tax_period}||${r.khai_type}||${r.so_lan}`
    if (!seen.has(k)) {
      seen.add(k)
      periodKeys.push({ mst: r.mst, period: r.tax_period, khaiType: r.khai_type, soLan: r.so_lan })
    }
  }
  periodKeys.sort((a, b) => a.period.localeCompare(b.period))

  if (periodKeys.length === 0) return <Empty />

  const lookup: Record<string, Record<string, number>> = {}
  for (const r of filtered) {
    const k = `${r.mst}||${r.tax_period}||${r.khai_type}||${r.so_lan}`
    if (!lookup[k]) lookup[k] = {}
    lookup[k][r.indicator_code] = (lookup[k][r.indicator_code] ?? 0) + r.value
  }

  return (
    <div className="overflow-auto max-h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900">
            <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-900 text-left px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 min-w-[300px]">
              Chỉ tiêu
            </th>
            <th className="sticky left-[300px] z-30 bg-gray-50 dark:bg-gray-900 text-center px-3 py-3 font-bold text-gray-500 border-b border-r border-gray-200 dark:border-gray-700 min-w-[60px]">
              Mã
            </th>
            {periodKeys.map((pk) => {
              const k = `${pk.mst}||${pk.period}||${pk.khaiType}||${pk.soLan}`
              return (
                <th
                  key={k}
                  className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[130px]"
                >
                  {periodKeys.some((p) => p.mst !== pk.mst) && (
                    <div className="text-[10px] text-gray-400">{pk.mst}</div>
                  )}
                  <div>{pk.period}</div>
                  {pk.khaiType && (
                    <div className="text-[10px] text-gray-400">
                      {pk.khaiType === 'C' ? 'Chính thức' : pk.khaiType === 'B' ? 'Bổ sung' : pk.khaiType}
                      {pk.soLan && ` #${pk.soLan}`}
                    </div>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {config.map((row, i) => {
            if (row.isHeader) {
              return (
                <tr key={i}>
                  <td
                    colSpan={2 + periodKeys.length}
                    className="sticky left-0 bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 font-bold text-xs px-4 py-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide"
                  >
                    {row.name}
                  </td>
                </tr>
              )
            }
            return (
              <tr key={row.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="sticky left-0 bg-white dark:bg-gray-950 px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-r border-gray-100 dark:border-gray-800 text-xs min-w-[300px]">
                  {row.name}
                </td>
                <td className="sticky left-[300px] bg-white dark:bg-gray-950 text-center px-3 py-2 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border-b border-r border-gray-100 dark:border-gray-800">
                  [{row.code}]
                </td>
                {periodKeys.map((pk) => {
                  const k = `${pk.mst}||${pk.period}||${pk.khaiType}||${pk.soLan}`
                  const val = lookup[k]?.[row.code] ?? 0
                  return (
                    <td
                      key={k}
                      className="text-right px-4 py-2 font-mono text-xs border-b border-r border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      {fmt(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Empty() {
  return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Không có dữ liệu</p>
      <p className="text-sm mt-1">Upload file XML để bắt đầu</p>
    </div>
  )
}
