'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface TaxUploadErrorRow {
  id: string
  file_name: string
  source: 'tax_upload' | 'tax_payment_upload'
  error_message: string
  raw_xml: string
  mst: string | null
  ten_nnt: string | null
  ten_tkhai: string | null
  status: 'pending' | 'resolved'
  admin_note: string | null
  created_at: string
  user_email: string
  user_name: string | null
}

const sourceLabel: Record<TaxUploadErrorRow['source'], string> = {
  tax_upload: 'Tờ khai',
  tax_payment_upload: 'Giấy nộp tiền',
}

function downloadXml(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function TaxUploadErrorsTable({ errors: initialErrors }: { errors: TaxUploadErrorRow[] }) {
  const [errors, setErrors] = useState(initialErrors)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending')
  const [resolveTarget, setResolveTarget] = useState<{ id: string; fileName: string } | null>(null)
  const [note, setNote] = useState('')

  async function handleResolve() {
    if (!resolveTarget) return
    setLoadingId(resolveTarget.id)
    const res = await fetch('/api/admin/tax-upload-errors/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resolveTarget.id, note }),
    })
    const data = await res.json()
    if (data.success) {
      setErrors((prev) =>
        prev.map((e) => (e.id === resolveTarget.id ? { ...e, status: 'resolved' as const, admin_note: note || null } : e))
      )
      toast.success('Đã đánh dấu xử lý xong')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
    setResolveTarget(null)
    setNote('')
  }

  const filtered = filter === 'all' ? errors : errors.filter((e) => e.status === filter)
  const pending = errors.filter((e) => e.status === 'pending')
  const counts = {
    all: errors.length,
    pending: pending.length,
    resolved: errors.filter((e) => e.status === 'resolved').length,
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'resolved', label: 'Đã xử lý' },
    { key: 'all', label: 'Tất cả' },
  ]

  const thBase = 'px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap'

  return (
    <div className="space-y-4">
      <Dialog open={!!resolveTarget} onOpenChange={(open) => { if (!open) { setResolveTarget(null); setNote('') } }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Đánh dấu đã xử lý — {resolveTarget?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Ghi chú <span className="text-gray-400">(không bắt buộc)</span></label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              rows={3}
              placeholder="Ví dụ: Đã nhập tay số liệu từ file cũ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveTarget(null); setNote('') }} disabled={!!loadingId}>
              Quay lại
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleResolve} disabled={!!loadingId}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">⏳ {pending.length} file lỗi chờ xử lý</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95
              ${filter === tab.key
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-slate-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className={`${thBase} text-left`}>File</th>
                <th className={`${thBase} text-left`}>Người upload</th>
                <th className={`${thBase} text-left`}>Loại</th>
                <th className={`${thBase} text-left`}>MST / Tên NNT / Mẫu</th>
                <th className={`${thBase} text-left`}>Lỗi</th>
                <th className={`${thBase} text-center`}>Trạng thái</th>
                <th className={`${thBase} text-center`}>Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
              {filtered.map((row, index) => {
                const rowBg = index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800/90'
                return (
                  <tr key={row.id} className={`transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 ${rowBg}`}>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-mono text-xs font-bold text-gray-900 dark:text-gray-50 truncate" title={row.file_name}>{row.file_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(row.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-200">{row.user_name || '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{row.user_email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                        {sourceLabel[row.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {row.mst || row.ten_nnt || row.ten_tkhai ? (
                        <div className="space-y-0.5">
                          {row.mst && <p className="text-xs font-mono text-gray-700 dark:text-gray-200">{row.mst}</p>}
                          {row.ten_nnt && <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={row.ten_nnt}>{row.ten_nnt}</p>}
                          {row.ten_tkhai && <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={row.ten_tkhai}>{row.ten_tkhai}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-sm text-red-600 dark:text-red-400 whitespace-normal break-words">{row.error_message}</p>
                      {row.status === 'resolved' && row.admin_note && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words mt-0.5">Ghi chú: {row.admin_note}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {row.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Chờ xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã xử lý
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs whitespace-nowrap"
                          onClick={() => downloadXml(row.file_name, row.raw_xml)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Tải XML
                        </Button>
                        {row.status === 'pending' && (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => { setResolveTarget({ id: row.id, fileName: row.file_name }); setNote('') }}
                            disabled={loadingId === row.id}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Đã xử lý
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Không có file nào trong mục này</p>
          </div>
        )}
      </div>
    </div>
  )
}
