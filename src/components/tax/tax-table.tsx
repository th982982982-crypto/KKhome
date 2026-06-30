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

function khaiTypeLabel(f: TaxFile) {
  const type = f.khai_type === 'C' ? 'Chính thức' : f.khai_type === 'B' ? 'Bổ sung' : (f.khai_type ?? '')
  const lan = f.so_lan != null ? ` - Lần ${f.so_lan}` : ''
  return type + lan
}

type ColDesc = { type: 'total'; yr: string } | { type: 'file'; file: TaxFile }

// Only 1 sticky column now (col1 = chỉ tiêu + mã số merged)
// This eliminates the left-[Npx] positioning bug where col2 would float over data
const STICKY_HEAD = 'sticky top-0 z-[20] bg-gray-50 dark:bg-gray-900'
const STICKY_COL1_HEAD = 'sticky top-0 left-0 z-[40] bg-gray-50 dark:bg-gray-900'
const STICKY_COL1_BODY = 'sticky left-0 z-[10] bg-white dark:bg-gray-950'

// Col1 width — locked so sticky data headers align correctly
const COL1_W = 'w-[340px] min-w-[340px] max-w-[340px]'

export function TaxTable({ files, declarationType, selectedMst, selectedYear, mode }: TaxTableProps) {
  // All hooks MUST be before any conditional return (Rules of Hooks)
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

  const allPeriodFiles = useMemo(
    () =>
      files
        .filter(
          (f) =>
            f.declaration_type === declarationType &&
            (selectedMst === 'all' || f.mst === selectedMst) &&
            (selectedYear === 'all' || f.tax_year === selectedYear)
        )
        .sort(
          (a, b) =>
            a.tax_year.localeCompare(b.tax_year) ||
            a.tax_period.localeCompare(b.tax_period) ||
            a.uploaded_at.localeCompare(b.uploaded_at)
        ),
    [files, declarationType, selectedMst, selectedYear]
  )

  const config = UI_CONFIG[declarationType]

  // ── YEAR MODE ────────────────────────────────────────────────────────
  if (mode === 'year') {
    const years = [...new Set(filtered.map((f) => f.tax_year))].sort((a, b) => parseInt(b) - parseInt(a))
    const mstList = selectedMst === 'all' ? [...new Set(filtered.map((f) => f.mst))] : [selectedMst]

    if (years.length === 0) return <Empty />

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
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${STICKY_COL1_HEAD} ${COL1_W} text-left px-4 py-3 font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide`}>
                Chỉ tiêu <span className="text-blue-400 font-normal">[Mã số]</span>
              </th>
              {mstList.map((mst) =>
                years.map((yr) => (
                  <th
                    key={`${mst}-${yr}`}
                    className={`${STICKY_HEAD} text-right px-4 py-3 font-bold text-gray-700 dark:text-gray-200 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[150px]`}
                  >
                    {mstList.length > 1 && <div className="text-[10px] text-gray-400 mb-0.5">{mst}</div>}
                    <div className="text-sm">{yr}</div>
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
                      colSpan={1 + mstList.length * years.length}
                      className="bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 font-bold text-xs px-4 py-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide"
                    >
                      {row.name}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={row.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className={`${STICKY_COL1_BODY} ${COL1_W} px-4 py-2 border-b border-r border-gray-100 dark:border-gray-800 text-xs`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-700 dark:text-gray-300 leading-snug">{row.name}</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">[{row.code}]</span>
                    </div>
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

  // ── PERIOD MODE ───────────────────────────────────────────────────────

  const years = [...new Set(allPeriodFiles.map((f) => f.tax_year))].sort(
    (a, b) => parseInt(a) - parseInt(b)
  )

  const byYear = new Map<string, TaxFile[]>()
  for (const yr of years) byYear.set(yr, allPeriodFiles.filter((f) => f.tax_year === yr))

  // Year totals: ĐƯỢC CỘNG only
  const yearTotals = new Map<string, Record<string, number>>()
  for (const [yr, yrFiles] of byYear) {
    const tot: Record<string, number> = {}
    for (const f of yrFiles.filter((f) => f.status === 'ĐƯỢC CỘNG')) {
      for (const [code, val] of Object.entries(f.indicators)) {
        tot[code] = (tot[code] ?? 0) + val
      }
    }
    yearTotals.set(yr, tot)
  }

  // Columns: [total-yr1, file1, file2, ..., total-yr2, ...]
  const cols: ColDesc[] = []
  for (const yr of years) {
    cols.push({ type: 'total', yr })
    for (const f of byYear.get(yr)!) cols.push({ type: 'file', file: f })
  }

  if (cols.length === 0) return <Empty />

  const multiMst = new Set(allPeriodFiles.map((f) => f.mst)).size > 1

  return (
    <div className="overflow-auto max-h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className={`${STICKY_COL1_HEAD} ${COL1_W} text-left px-4 py-3 font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide`}>
              Chỉ tiêu <span className="text-blue-400 font-normal">[Mã số]</span>
            </th>
            {cols.map((col) => {
              if (col.type === 'total') {
                return (
                  <th
                    key={`tot-${col.yr}`}
                    className={`${STICKY_HEAD} text-right px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[150px]`}
                  >
                    <div className="text-[9px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">Tổng năm</div>
                    <div className="text-sm">{col.yr}</div>
                  </th>
                )
              }
              const isReplaced = col.file.status === 'THAY THẾ'
              return (
                <th
                  key={col.file.id}
                  className={`${STICKY_HEAD} text-right px-3 py-2 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[130px]`}
                >
                  {multiMst && (
                    <div className="text-[9px] text-gray-400 mb-0.5">{col.file.mst}</div>
                  )}
                  <div className={`text-xs font-bold ${isReplaced ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    Kỳ {col.file.tax_period}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isReplaced ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    [{khaiTypeLabel(col.file)}]
                  </div>
                  <div className={`text-[9px] font-semibold mt-0.5 ${isReplaced ? 'text-amber-500' : 'text-emerald-500'}`}>
                    ● {isReplaced ? 'THAY THẾ' : 'ĐƯỢC CỘNG'}
                  </div>
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
                    colSpan={1 + cols.length}
                    className="bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 font-bold text-xs px-4 py-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide"
                  >
                    {row.name}
                  </td>
                </tr>
              )
            }
            return (
              <tr key={row.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className={`${STICKY_COL1_BODY} ${COL1_W} px-4 py-2 border-b border-r border-gray-100 dark:border-gray-800 text-xs`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-gray-700 dark:text-gray-300 leading-snug">{row.name}</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">[{row.code}]</span>
                  </div>
                </td>
                {cols.map((col) => {
                  if (col.type === 'total') {
                    return (
                      <td
                        key={`tot-${col.yr}-${row.code}`}
                        className="text-right px-4 py-2 font-mono text-xs font-bold border-b border-r border-gray-100 dark:border-gray-800 bg-emerald-50/60 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300"
                      >
                        {fmt(yearTotals.get(col.yr)?.[row.code] ?? 0)}
                      </td>
                    )
                  }
                  const isReplaced = col.file.status === 'THAY THẾ'
                  return (
                    <td
                      key={`${col.file.id}-${row.code}`}
                      className={`text-right px-4 py-2 font-mono text-xs border-b border-r border-gray-100 dark:border-gray-800 ${
                        isReplaced
                          ? 'text-gray-400 dark:text-gray-600'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {fmt((col.file.indicators as Record<string, number>)[row.code] ?? 0)}
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
