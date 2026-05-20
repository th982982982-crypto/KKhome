'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Eye, ArrowRight } from 'lucide-react'

interface PreviewData {
  headers: string[]
  mapping: Record<number, string>
  preview: Record<string, string | number | boolean | null>[]
  total: number
}

export function SyncSheets() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [synced, setSynced] = useState<number | null>(null)

  async function handlePreview() {
    setLoading(true)
    const res = await fetch('/api/admin/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview: true }),
    })
    const data = await res.json()
    if (data.error) {
      toast.error(data.error)
    } else {
      setPreview(data)
    }
    setLoading(false)
  }

  async function handleSync() {
    setLoading(true)
    const res = await fetch('/api/admin/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview: false }),
    })
    const data = await res.json()
    if (data.error) {
      toast.error(data.error)
    } else {
      setSynced(data.synced)
      setPreview(null)
      toast.success(`Đã đồng bộ ${data.synced} templates`)
    }
    setLoading(false)
  }

  const fieldNames: Record<string, string> = {
    name: 'Tên', slug: 'Slug', description: 'Mô tả', category: 'Danh mục',
    sale_price: 'Giá bán', original_price: 'Giá gốc', thumbnail_url: 'Ảnh',
    google_sheet_embed_url: 'Link embed', google_sheet_copy_url: 'Link copy',
    tutorial_video_url: 'Video', tags: 'Tags', is_published: 'Hiển thị', sort_order: 'Thứ tự',
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Cấu hình</h2>
        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500 dark:text-gray-400">Sheet ID:</span> <span className="font-mono text-gray-900 dark:text-gray-100">{process.env.NEXT_PUBLIC_SHEET_CATALOG_ID || '(chưa cấu hình trong .env)'}</span></p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">Cài đặt trong .env: GOOGLE_SHEET_CATALOG_ID và GOOGLE_SHEETS_API_KEY</p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-2 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Eye className="w-4 h-4" />
            Xem trước mapping
          </Button>
          <Button
            className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center gap-2"
            onClick={handleSync}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Đồng bộ ngay
          </Button>
        </div>
      </div>

      {synced !== null && (
        <div className="bg-green-50 dark:bg-emerald-950/40 border border-green-100 dark:border-emerald-800 rounded-xl p-4 text-green-800 dark:text-emerald-200 text-sm">
          ✅ Đã đồng bộ thành công <strong>{synced}</strong> templates từ Google Sheets.
        </div>
      )}

      {preview && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Kết quả phát hiện cột</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tổng: <strong className="text-gray-900 dark:text-gray-100">{preview.total}</strong> dòng dữ liệu | Đã khớp <strong className="text-gray-900 dark:text-gray-100">{Object.keys(preview.mapping).length}</strong>/{preview.headers.length} cột
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 rounded-l-lg">Cột trong Sheet</th>
                  <th className="text-left px-3 py-2 text-gray-400 dark:text-gray-500">→</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 rounded-r-lg">Trường DB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {preview.headers.map((header, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-200">{header}</td>
                    <td className="px-3 py-2 text-gray-300 dark:text-gray-600"><ArrowRight className="w-3 h-3" /></td>
                    <td className="px-3 py-2">
                      {preview.mapping[i] ? (
                        <span className="text-green-600 dark:text-emerald-400 font-medium">{fieldNames[preview.mapping[i]] || preview.mapping[i]}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 italic">bỏ qua</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">3 dòng đầu:</p>
              <div className="space-y-2">
                {preview.preview.map((row, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-200">
                    <strong>{row.name as string}</strong>
                    {row.sale_price && <span className="ml-2 text-green-600 dark:text-emerald-400">{Number(row.sale_price).toLocaleString('vi-VN')}đ</span>}
                    {row.category && <span className="ml-2 text-gray-400 dark:text-gray-500">[{row.category as string}]</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="mt-4 bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            onClick={handleSync}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Xác nhận và đồng bộ {preview.total} templates
          </Button>
        </div>
      )}
    </div>
  )
}
