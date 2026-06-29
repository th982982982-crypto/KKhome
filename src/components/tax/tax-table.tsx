'use client'

import { useMemo } from 'react'
import { UI_CONFIG, type DeclarationType } from '@/lib/tax/ui-config'
import type { TaxFile } from '@/lib/supabase/types'

interface TaxTableProps {
  files: TaxFile[]
  declarationType: DeclarationType
  selectedMst: string
  selectedYear: string
  mode: 'year' | 'period'
}

function fmt(v: number): string {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

export function TaxTable({ files, declarationType, selectedMst, selectedYear, mode }: TaxTableProps) {
  const filtered = useMemo(
    () =>
      files.filter(
        (f) =>
          f.declaration_type === declarationType &&
          f.status === 'ĐƯỢC CỘNG' &&
          (selectedMst === 'all' || f.mst === selectedMst) &&
          (selectedYear === 'all' || f.tax_year === selectedYear)
      ),
    [files, declarationType, selectedMst, selectedYear]
  )

  const config = UI_CONFIG[declarationType]

  if (mode === 'year') {
    const years = [...new Set(filtered.map((f) => f.tax_year))].sort((a, b) => parseInt(b) - parseInt(a))
    const mstList = selectedMst === 'all' ? [...new Set(filtered.map((f) => f.mst))] : [selectedMst]

    if (years.length === 0) return <Empty />

    // Sum indicators per mst+year
    const pivot: Record<string, Record<string, Record<string, number>>> = {}
    for (const f of filtered) {
      if (!pivot[f.mst]) pivot[f.mst] = {}
      if (!pivot[f.mst][f.tax_year]) pivot[f.mst][f.tax_year] = {}
      for (const [code, val] of Object.entries(f.indicators)) {
        pivot[f.mst][f.tax_year][code] = (pivot[f.mst][f.tax_year][code] ?? 0) + val
      }
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

  // Period mode — each file is one column
  const sorted = [...filtered].sort((a, b) => a.tax_period.localeCompare(b.tax_period))

  if (sorted.length === 0) return <Empty />

  const multiMst = new Set(sorted.map((f) => f.mst)).size > 1

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
            {sorted.map((f) => (
              <th
                key={f.id}
                className="text-right px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[130px]"
              >
                {multiMst && <div className="text-[10px] text-gray-400">{f.mst}</div>}
                <div>{f.tax_period}</div>
                {f.khai_type && (
                  <div className="text-[10px] text-gray-400">
                    {f.khai_type === 'C' ? 'Chính thức' : f.khai_type === 'B' ? 'Bổ sung' : f.khai_type}
                    {f.so_lan && ` #${f.so_lan}`}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.map((row, i) => {
            if (row.isHeader) {
              return (
                <tr key={i}>
                  <td
                    colSpan={2 + sorted.length}
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
                {sorted.map((f) => {
                  const val = f.indicators[row.code] ?? 0
                  return (
                    <td
                      key={f.id}
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
