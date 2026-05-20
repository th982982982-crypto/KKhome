'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import type { Template } from '@/lib/supabase/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { GalleryUpload } from '@/components/ui/gallery-upload'

type Row = Partial<Template> & { _isNew?: boolean; _saving?: boolean; _dirty?: boolean }

const COLS = [
  { key: 'sort_order', label: 'STT', width: 'w-14', type: 'number' },
  { key: 'name', label: 'Tên template', width: 'w-52', type: 'text', required: true },
  { key: 'sku', label: 'SKU', width: 'w-28', type: 'text' },
  { key: 'category', label: 'Danh mục', width: 'w-32', type: 'text' },
  { key: 'sale_price', label: 'Giá bán', width: 'w-28', type: 'number' },
  { key: 'original_price', label: 'Giá gốc', width: 'w-28', type: 'number' },
  { key: 'description', label: 'Mô tả', width: 'w-56', type: 'text' },
  { key: 'google_sheet_embed_url', label: 'Link embed', width: 'w-48', type: 'text' },
  { key: 'google_sheet_copy_url', label: 'Link copy', width: 'w-48', type: 'text' },
  { key: 'tutorial_video_url', label: 'Link video', width: 'w-48', type: 'text' },
  { key: 'tags', label: 'Tags (cách nhau bởi dấu ,)', width: 'w-44', type: 'text' },
] as const

export function TemplateEditor({ initialTemplates }: { initialTemplates: Template[] }) {
  const [rows, setRows] = useState<Row[]>(initialTemplates)

  const updateRow = useCallback((index: number, key: string, value: string | number | boolean | string[]) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [key]: value, _dirty: true } : r))
  }, [])

  function addRow() {
    setRows(prev => [...prev, {
      _isNew: true, _dirty: true,
      is_published: true, sort_order: prev.length + 1,
      name: '', sku: null, category: '', description: '',
      sale_price: null, original_price: null,
      thumbnail_url: null, gallery_urls: [], google_sheet_embed_url: null,
      google_sheet_copy_url: null, tutorial_video_url: null, tags: null,
    }])
  }

  async function saveRow(index: number) {
    const row = rows[index]
    if (!row.name?.trim()) { toast.error('Tên template không được để trống'); return }

    setRows(prev => prev.map((r, i) => i === index ? { ...r, _saving: true } : r))

    const payload = {
      name: row.name,
      sku: row.sku || null,
      category: row.category || null,
      description: row.description || null,
      sale_price: row.sale_price ? Number(row.sale_price) : null,
      original_price: row.original_price ? Number(row.original_price) : null,
      thumbnail_url: row.thumbnail_url || null,
      gallery_urls: row.gallery_urls ?? [],
      google_sheet_embed_url: row.google_sheet_embed_url || null,
      google_sheet_copy_url: row.google_sheet_copy_url || null,
      tutorial_video_url: row.tutorial_video_url || null,
      tags: row.tags ? (Array.isArray(row.tags) ? row.tags : (row.tags as string).split(',').map(t => t.trim()).filter(Boolean)) : null,
      is_published: row.is_published ?? true,
      sort_order: Number(row.sort_order) || 0,
    }

    try {
      let res
      if (row._isNew) {
        res = await fetch('/api/admin/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`/api/admin/templates/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(prev => prev.map((r, i) => i === index ? { ...data, _dirty: false, _saving: false } : r))
      toast.success('Đã lưu')
    } catch (e) {
      toast.error((e as Error).message)
      setRows(prev => prev.map((r, i) => i === index ? { ...r, _saving: false } : r))
    }
  }

  async function deleteRow(index: number) {
    const row = rows[index]
    if (row._isNew) { setRows(prev => prev.filter((_, i) => i !== index)); return }
    if (!confirm(`Xóa "${row.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/templates/${row.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xóa thất bại')
      setRows(prev => prev.filter((_, i) => i !== index))
      toast.success('Đã xóa')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  function getTagString(tags: string[] | string | null | undefined) {
    if (!tags) return ''
    if (Array.isArray(tags)) return tags.join(', ')
    return tags
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{rows.length} templates • Tự động lưu khi click ra ngoài dòng</p>
        <button
          onClick={addRow}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm template
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="text-sm border-collapse" style={{ minWidth: 'max-content' }}>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
              {COLS.map(col => (
                <th key={col.key} className={`${col.width} px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 last:border-r-0`}>
                  {col.label}
                </th>
              ))}
              <th className="w-36 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-100 dark:border-gray-800">Ảnh chính</th>
              <th className="w-52 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-100 dark:border-gray-800">Ảnh gallery</th>
              <th className="w-24 px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Hiển thị</th>
              <th className="w-24 px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id || `new-${index}`}
                className={`border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${row._dirty ? 'bg-yellow-50/40 dark:bg-amber-950/20' : ''}`}
                onBlur={(e) => {
                  if (!rows[index]._dirty || rows[index]._saving) return
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  saveRow(index)
                }}
              >
                {COLS.map(col => (
                  <td key={col.key} className={`${col.width} px-2 py-1.5 border-r border-gray-100 dark:border-gray-800 last:border-r-0`}>
                    <input
                      type={col.type}
                      value={col.key === 'tags' ? getTagString(row.tags) : (row[col.key as keyof Row] as string | number) ?? ''}
                      onChange={e => updateRow(index, col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)}
                      placeholder={col.label}
                      className="w-full bg-transparent border border-transparent focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-950 rounded px-1.5 py-1 outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 text-xs"
                    />
                  </td>
                ))}
                <td className="w-36 px-2 py-1.5 border-r border-gray-100 dark:border-gray-800">
                  <ImageUpload
                    value={row.thumbnail_url}
                    onChange={(url) => updateRow(index, 'thumbnail_url', url)}
                    onClear={() => updateRow(index, 'thumbnail_url', '')}
                  />
                </td>
                <td className="w-52 px-2 py-1.5 border-r border-gray-100 dark:border-gray-800">
                  <GalleryUpload
                    values={row.gallery_urls ?? []}
                    onChange={(urls) => updateRow(index, 'gallery_urls', urls)}
                  />
                </td>
                <td className="w-24 px-3 py-1.5 text-center">
                  <button
                    onClick={() => updateRow(index, 'is_published', !row.is_published)}
                    className={`p-1.5 rounded-lg transition-colors ${row.is_published ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/40 hover:bg-green-100 dark:hover:bg-emerald-950/60' : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title={row.is_published ? 'Đang hiển thị' : 'Đang ẩn'}
                  >
                    {row.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </td>
                <td className="w-24 px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => saveRow(index)}
                      disabled={row._saving || !row._dirty}
                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Lưu"
                    >
                      {row._saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteRow(index)}
                      className="p-1.5 rounded-lg text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 4} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  Chưa có template nào. Nhấn &quot;Thêm template&quot; để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
