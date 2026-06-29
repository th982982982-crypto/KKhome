import type { TaxDataRow, TaxAuditNote } from '../supabase/types'

export interface GtgtAuditResult {
  keyId: string
  periodJ: string
  periodJ1: string
  val43: number
  val22: number
  diff: number
  status: 'Khớp số liệu' | 'Có chênh lệch cần kiểm tra'
  note: string
}

export interface RevenueAuditResult {
  keyId: string
  year: string
  val34: number
  val04: number
  diff: number
  status: 'Khớp số liệu' | 'Có chênh lệch cần kiểm tra'
  note: string
}

function getPeriodTimeScore(periodStr: string): number {
  const parts = periodStr.split('/')
  if (parts.length < 2) return 0
  const year = parseInt(parts[parts.length - 1])
  const prefix = parts[0].toUpperCase()
  if (prefix.includes('QUÝ')) {
    const q = parseInt(prefix.replace('QUÝ', '').trim())
    return year * 12 + q * 3
  }
  const m = parseInt(prefix)
  return year * 12 + m
}

export function runGtgtSequenceAudit(
  gtgtRows: TaxDataRow[],
  mst: string,
  notesMap: Record<string, string>
): GtgtAuditResult[] {
  const periods = [...new Set(gtgtRows.map((r) => r.tax_period))].sort(
    (a, b) => getPeriodTimeScore(a) - getPeriodTimeScore(b)
  )

  const results: GtgtAuditResult[] = []
  for (let i = 0; i < periods.length - 1; i++) {
    const pJ = periods[i]
    const pJ1 = periods[i + 1]
    const val43 = gtgtRows.find((r) => r.tax_period === pJ && r.indicator_code === '43')?.value ?? 0
    const val22 = gtgtRows.find((r) => r.tax_period === pJ1 && r.indicator_code === '22')?.value ?? 0
    const diff = val22 - val43
    const keyId = `GTGT_${mst}_${pJ.replace('/', '')}_${pJ1.replace('/', '')}`
    results.push({
      keyId,
      periodJ: pJ,
      periodJ1: pJ1,
      val43,
      val22,
      diff,
      status: diff === 0 ? 'Khớp số liệu' : 'Có chênh lệch cần kiểm tra',
      note: notesMap[keyId] ?? '',
    })
  }
  return results
}

export function runRevenueCrossAudit(
  gtgtRows: TaxDataRow[],
  tndnRows: TaxDataRow[],
  mst: string,
  notesMap: Record<string, string>
): RevenueAuditResult[] {
  const years = [
    ...new Set([...gtgtRows.map((r) => r.tax_year), ...tndnRows.map((r) => r.tax_year)]),
  ].sort((a, b) => parseInt(b) - parseInt(a))

  return years.map((yr) => {
    const val34 = gtgtRows
      .filter((r) => r.tax_year === yr && r.indicator_code === '34')
      .reduce((s, r) => s + r.value, 0)
    const val04 = tndnRows.find((r) => r.tax_year === yr && r.indicator_code === '04')?.value ?? 0
    const diff = val34 - val04
    const keyId = `REV_${mst}_${yr}`
    return {
      keyId,
      year: yr,
      val34,
      val04,
      diff,
      status: diff === 0 ? 'Khớp số liệu' : 'Có chênh lệch cần kiểm tra',
      note: notesMap[keyId] ?? '',
    }
  })
}

export function buildNotesMap(notes: TaxAuditNote[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const n of notes) map[n.key_id] = n.note_text ?? ''
  return map
}
