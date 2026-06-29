import type { TaxFile } from '../supabase/types'

export interface GtgtAuditResult {
  keyId: string
  periodJ: string
  periodJ1: string
  val43: number
  val22: number
  diff: number
  status: 'Khớp số liệu' | 'Có chênh lệch cần kiểm tra'
}

export interface RevenueAuditResult {
  keyId: string
  year: string
  val34: number
  val04: number
  diff: number
  status: 'Khớp số liệu' | 'Có chênh lệch cần kiểm tra'
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

export function runGtgtSequenceAudit(gtgtFiles: TaxFile[], mst: string): GtgtAuditResult[] {
  // Only ĐƯỢC CỘNG files, sorted by period
  const active = gtgtFiles
    .filter((f) => f.declaration_type === 'GTGT' && f.status === 'ĐƯỢC CỘNG')
    .sort((a, b) => getPeriodTimeScore(a.tax_period) - getPeriodTimeScore(b.tax_period))

  const results: GtgtAuditResult[] = []
  for (let i = 0; i < active.length - 1; i++) {
    const fJ = active[i]
    const fJ1 = active[i + 1]
    const val43 = fJ.indicators['43'] ?? 0
    const val22 = fJ1.indicators['22'] ?? 0
    const diff = val22 - val43
    const keyId = `GTGT_${mst}_${fJ.tax_period.replace('/', '')}_${fJ1.tax_period.replace('/', '')}`
    results.push({
      keyId,
      periodJ: fJ.tax_period,
      periodJ1: fJ1.tax_period,
      val43,
      val22,
      diff,
      status: diff === 0 ? 'Khớp số liệu' : 'Có chênh lệch cần kiểm tra',
    })
  }
  return results
}

export function runRevenueCrossAudit(files: TaxFile[], mst: string): RevenueAuditResult[] {
  const gtgt = files.filter((f) => f.declaration_type === 'GTGT' && f.status === 'ĐƯỢC CỘNG')
  const tndn = files.filter((f) => f.declaration_type === 'TNDN' && f.status === 'ĐƯỢC CỘNG')

  const years = [...new Set([...gtgt.map((f) => f.tax_year), ...tndn.map((f) => f.tax_year)])].sort(
    (a, b) => parseInt(b) - parseInt(a)
  )

  return years.map((yr) => {
    const val34 = gtgt.filter((f) => f.tax_year === yr).reduce((s, f) => s + (f.indicators['34'] ?? 0), 0)
    const val04 = tndn.find((f) => f.tax_year === yr)?.indicators['04'] ?? 0
    const diff = val34 - val04
    const keyId = `REV_${mst}_${yr}`
    return {
      keyId,
      year: yr,
      val34,
      val04,
      diff,
      status: diff === 0 ? 'Khớp số liệu' : 'Có chênh lệch cần kiểm tra',
    }
  })
}
