'use client'

import { useMemo, useState } from 'react'
import { BCTC_CDKT, BCTC_KQKD, BCTC_LCTT } from '@/lib/tax/ui-config'
import type { TaxFile } from '@/lib/supabase/types'

type BctcSection = 'CDKT' | 'KQKD' | 'LCTT'

interface Props {
  files: TaxFile[]
  selectedMst: string
  selectedYear: string
}

function fmt(v: number): string {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

// Only 1 sticky column (merged chỉ tiêu + mã số)
const STICKY_HEAD = 'sticky top-0 z-[20] bg-gray-50 dark:bg-gray-900'
const STICKY_COL1_HEAD = 'sticky top-0 left-0 z-[40] bg-gray-50 dark:bg-gray-900'
const STICKY_COL1_BODY = 'sticky left-0 z-[10] bg-white dark:bg-gray-950'
const STICKY_COL1_SECTION = 'sticky left-0 z-[10] bg-orange-50 dark:bg-orange-950/20'
const COL1_W = 'w-[340px] min-w-[340px] max-w-[340px]'

type BctcCol =
  | { type: 'cdkt-cuoi'; file: TaxFile }
  | { type: 'cdkt-dau';  file: TaxFile }
  | { type: 'kqkd-nay';  file: TaxFile }
  | { type: 'kqkd-truoc'; file: TaxFile; priorYear: string }
  | { type: 'lctt-nay';  file: TaxFile }
  | { type: 'lctt-truoc'; file: TaxFile; priorYear: string }

function getVal(file: TaxFile, key: string): number {
  return (file.indicators as Record<string, number>)[key] ?? 0
}

export function BctcTable({ files, selectedMst, selectedYear }: Props) {
  const [section, setSection] = useState<BctcSection>('CDKT')

  const bctcFiles = useMemo(() =>
    files
      .filter(f =>
        f.declaration_type === 'BCTC' &&
        f.status === 'ĐƯỢC CỘNG' &&
        (selectedMst === 'all' || f.mst === selectedMst) &&
        (selectedYear === 'all' || f.tax_year === selectedYear)
      )
      .sort((a, b) => parseInt(b.tax_year) - parseInt(a.tax_year)),
    [files, selectedMst, selectedYear]
  )

  if (!bctcFiles.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Chưa có Báo cáo tài chính</p>
      <p className="text-sm mt-1">Upload file XML BCTC (TT200/2014/TT-BTC)</p>
    </div>
  )

  const cols: BctcCol[] = []
  if (section === 'CDKT') {
    for (const f of bctcFiles) {
      cols.push({ type: 'cdkt-cuoi', file: f })
      cols.push({ type: 'cdkt-dau',  file: f })
    }
  } else if (section === 'KQKD') {
    for (const f of bctcFiles) {
      cols.push({ type: 'kqkd-nay',   file: f })
      cols.push({ type: 'kqkd-truoc', file: f, priorYear: String(parseInt(f.tax_year) - 1) })
    }
  } else {
    for (const f of bctcFiles) {
      cols.push({ type: 'lctt-nay',   file: f })
      cols.push({ type: 'lctt-truoc', file: f, priorYear: String(parseInt(f.tax_year) - 1) })
    }
  }

  function colHeader(col: BctcCol) {
    if (col.type === 'cdkt-cuoi') return { top: `Năm ${col.file.tax_year}`, sub: 'Số cuối năm', emerald: true }
    if (col.type === 'cdkt-dau')  return { top: `Năm ${col.file.tax_year}`, sub: 'Số đầu năm', emerald: false }
    if (col.type === 'kqkd-nay')  return { top: `Năm ${col.file.tax_year}`, sub: 'Năm nay', emerald: true }
    if (col.type === 'kqkd-truoc') return { top: `Năm ${col.priorYear}`, sub: 'Năm trước', emerald: false }
    if (col.type === 'lctt-nay')  return { top: `Năm ${col.file.tax_year}`, sub: 'Năm nay', emerald: true }
    return { top: `Năm ${(col as { priorYear: string }).priorYear}`, sub: 'Năm trước', emerald: false }
  }

  function colVal(col: BctcCol, code: string): number {
    if (col.type === 'cdkt-cuoi') return getVal(col.file, `CDKT_cuoi_${code}`)
    if (col.type === 'cdkt-dau')  return getVal(col.file, `CDKT_dau_${code}`)
    if (col.type === 'kqkd-nay')  return getVal(col.file, `KQKD_nay_${code}`)
    if (col.type === 'kqkd-truoc') return getVal(col.file, `KQKD_truoc_${code}`)
    if (col.type === 'lctt-nay')  return getVal(col.file, `LCTT_nay_${code}`)
    return getVal(col.file, `LCTT_truoc_${code}`)
  }

  const config = section === 'CDKT' ? BCTC_CDKT : section === 'KQKD' ? BCTC_KQKD : BCTC_LCTT

  const SECTION_TABS: { key: BctcSection; label: string }[] = [
    { key: 'CDKT', label: 'Cân đối kế toán' },
    { key: 'KQKD', label: 'Kết quả kinh doanh' },
    { key: 'LCTT', label: 'Lưu chuyển tiền tệ' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {SECTION_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              section === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-auto max-h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${STICKY_COL1_HEAD} ${COL1_W} text-left px-4 py-3 font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wide`}>
                Chỉ tiêu BCTC <span className="text-blue-400 font-normal">[Mã số]</span>
              </th>
              {cols.map((col, i) => {
                const h = colHeader(col)
                return (
                  <th
                    key={i}
                    className={`${STICKY_HEAD} text-right px-4 py-2 border-b border-r border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[150px] ${
                      h.emerald ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className={`text-xs font-bold ${h.emerald ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-300'}`}>
                      {h.top}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${h.emerald ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {h.sub}
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
                    <td className={`${STICKY_COL1_SECTION} ${COL1_W} text-orange-800 dark:text-orange-300 font-bold text-xs px-4 py-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide`}>
                      {row.name}
                    </td>
                    <td colSpan={cols.length} className="bg-orange-50 dark:bg-orange-950/20 border-b border-gray-200 dark:border-gray-700" />
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
                  {cols.map((col, ci) => {
                    const val = colVal(col, row.code)
                    const h = colHeader(col)
                    return (
                      <td
                        key={ci}
                        className={`text-right px-4 py-2 font-mono text-xs border-b border-r border-gray-100 dark:border-gray-800 ${
                          h.emerald
                            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/10'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
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
    </div>
  )
}
