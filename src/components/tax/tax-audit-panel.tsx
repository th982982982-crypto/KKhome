'use client'

import { useState } from 'react'
import type { GtgtAuditResult, RevenueAuditResult } from '@/lib/tax/audit-engine'
import { toast } from 'sonner'

function fmt(v: number) {
  if (!v) return '—'
  return v.toLocaleString('vi-VN')
}

interface AuditBadgeProps { diff: number }
function AuditBadge({ diff }: AuditBadgeProps) {
  if (diff === 0)
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">Khớp số liệu</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse">Có chênh lệch</span>
}

interface NoteInputProps {
  keyId: string
  mst: string
  auditType: string
  initialNote: string
  onSaved: (keyId: string, note: string) => void
}

function NoteInput({ keyId, mst, auditType, initialNote, onSaved }: NoteInputProps) {
  const [note, setNote] = useState(initialNote)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/tax/audit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId, mst, audit_type: auditType, note_text: note }),
      })
      if (!res.ok) throw new Error()
      onSaved(keyId, note)
      toast.success('Đã lưu ghi chú')
    } catch {
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2 mt-1">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú giải trình..."
        className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400"
      />
      <button
        onClick={save}
        disabled={saving}
        className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
      >
        {saving ? '...' : 'Lưu'}
      </button>
    </div>
  )
}

interface TaxAuditBalProps {
  data: GtgtAuditResult[]
  mst: string
}

export function TaxAuditBalPanel({ data, mst }: TaxAuditBalProps) {
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(data.map((r) => [r.keyId, r.note]))
  )

  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Chọn một MST cụ thể để chạy đối soát</p>
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
            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[240px]">Ghi chú</th>
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
                <NoteInput
                  keyId={row.keyId}
                  mst={mst}
                  auditType="GTGT_BAL"
                  initialNote={notes[row.keyId] ?? ''}
                  onSaved={(k, n) => setNotes((prev) => ({ ...prev, [k]: n }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface TaxAuditRevProps {
  data: RevenueAuditResult[]
  mst: string
}

export function TaxAuditRevPanel({ data, mst }: TaxAuditRevProps) {
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(data.map((r) => [r.keyId, r.note]))
  )

  if (!data.length) return (
    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
      <p className="font-semibold">Chọn một MST cụ thể để chạy đối soát</p>
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
            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 min-w-[240px]">Ghi chú</th>
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
                <NoteInput
                  keyId={row.keyId}
                  mst={mst}
                  auditType="REVENUE"
                  initialNote={notes[row.keyId] ?? ''}
                  onSaved={(k, n) => setNotes((prev) => ({ ...prev, [k]: n }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
