'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Eye, EyeOff, ExternalLink, ImageIcon } from 'lucide-react'
import type { Template } from '@/lib/supabase/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { GalleryUpload } from '@/components/ui/gallery-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'

type Mode = 'closed' | 'create' | 'view' | 'edit'

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  description: '',
  sale_price: '' as number | '',
  original_price: '' as number | '',
  thumbnail_url: null as string | null,
  gallery_urls: [] as string[],
  google_sheet_embed_url: '',
  google_sheet_copy_url: '',
  tutorial_video_url: '',
  tags: '',
  is_published: true,
  sort_order: 0,
}
type FormState = typeof EMPTY_FORM

function toForm(t: Template): FormState {
  return {
    name: t.name,
    sku: t.sku ?? '',
    category: t.category ?? '',
    description: t.description ?? '',
    sale_price: t.sale_price ?? '',
    original_price: t.original_price ?? '',
    thumbnail_url: t.thumbnail_url,
    gallery_urls: t.gallery_urls ?? [],
    google_sheet_embed_url: t.google_sheet_embed_url ?? '',
    google_sheet_copy_url: t.google_sheet_copy_url ?? '',
    tutorial_video_url: t.tutorial_video_url ?? '',
    tags: (t.tags ?? []).join(', '),
    is_published: t.is_published,
    sort_order: t.sort_order,
  }
}

export function TemplateEditor({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [mode, setMode] = useState<Mode>('closed')
  const [selected, setSelected] = useState<Template | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setSelected(null)
    setForm({ ...EMPTY_FORM, sort_order: templates.length + 1 })
    setMode('create')
  }

  function openView(t: Template) {
    setSelected(t)
    setMode('view')
  }

  function openEdit() {
    if (!selected) return
    setForm(toForm(selected))
    setMode('edit')
  }

  function closeModal() {
    setMode('closed')
    setSelected(null)
  }

  async function togglePublish(t: Template, e: React.MouseEvent) {
    e.stopPropagation()
    const next = !t.is_published
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_published: next } : x))
    const res = await fetch(`/api/admin/templates/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: next }),
    })
    if (!res.ok) {
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_published: !next } : x))
      toast.error('Cập nhật thất bại')
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Tên template không được để trống'); return }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      sale_price: form.sale_price === '' ? null : Number(form.sale_price),
      original_price: form.original_price === '' ? null : Number(form.original_price),
      thumbnail_url: form.thumbnail_url || null,
      gallery_urls: form.gallery_urls,
      google_sheet_embed_url: form.google_sheet_embed_url.trim() || null,
      google_sheet_copy_url: form.google_sheet_copy_url.trim() || null,
      tutorial_video_url: form.tutorial_video_url.trim() || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : null,
      is_published: form.is_published,
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      const res = mode === 'edit' && selected
        ? await fetch(`/api/admin/templates/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (mode === 'edit' && selected) {
        setTemplates(prev => prev.map(t => t.id === selected.id ? data : t))
        toast.success('Đã cập nhật')
      } else {
        setTemplates(prev => [...prev, data])
        toast.success('Đã thêm template')
      }
      closeModal()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    if (!confirm(`Xóa "${selected.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/templates/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xóa thất bại')
      setTemplates(prev => prev.filter(t => t.id !== selected.id))
      toast.success('Đã xóa')
      closeModal()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{templates.length} templates</p>
        <Button onClick={openCreate} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Thêm template
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
              <th className="w-12 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">STT</th>
              <th className="w-14 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Ảnh</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Tên template</th>
              <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">SKU</th>
              <th className="w-32 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Danh mục</th>
              <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Giá bán</th>
              <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Giá gốc</th>
              <th className="w-24 px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t, index) => (
              <tr
                key={t.id}
                onClick={() => openView(t)}
                className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{t.sort_order ?? index + 1}</td>
                <td className="px-3 py-2">
                  {t.thumbnail_url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image src={t.thumbnail_url} alt={t.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{t.name}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{t.sku || '—'}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{t.category || '—'}</td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{t.sale_price ? formatCurrency(t.sale_price) : '—'}</td>
                <td className="px-3 py-2 text-gray-400 dark:text-gray-500">{t.original_price ? formatCurrency(t.original_price) : '—'}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={(e) => togglePublish(t, e)}
                    className={`p-1.5 rounded-lg transition-colors ${t.is_published ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/40 hover:bg-green-100 dark:hover:bg-emerald-950/60' : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title={t.is_published ? 'Đang hiển thị' : 'Đang ẩn'}
                  >
                    {t.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  Chưa có template nào. Nhấn &quot;Thêm template&quot; để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết */}
      <Dialog open={mode === 'view'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {selected.thumbnail_url && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image src={selected.thumbnail_url} alt={selected.name} fill className="object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="SKU" value={selected.sku} />
                  <Field label="Danh mục" value={selected.category} />
                  <Field label="Giá bán" value={selected.sale_price ? formatCurrency(selected.sale_price) : null} />
                  <Field label="Giá gốc" value={selected.original_price ? formatCurrency(selected.original_price) : null} />
                </div>
                <Field label="Mô tả" value={selected.description} />
                <Field label="Link embed" value={selected.google_sheet_embed_url} link />
                <Field label="Link copy" value={selected.google_sheet_copy_url} link />
                <Field label="Link video" value={selected.tutorial_video_url} link />
                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{tag}</span>
                    ))}
                  </div>
                )}
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${selected.is_published ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {selected.is_published ? 'Đang hiển thị' : 'Đang ẩn'}
                </span>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto gap-1.5">
                  <Trash2 className="w-4 h-4" /> Xóa
                </Button>
                <Button variant="outline" onClick={closeModal}>Đóng</Button>
                <Button onClick={openEdit} className="gap-1.5">
                  <Pencil className="w-4 h-4" /> Sửa
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal thêm / sửa */}
      <Dialog open={mode === 'create' || mode === 'edit'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Chỉnh sửa template' : 'Thêm template mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tên template *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Timeline hệ thống pháp luật" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Giá bán</Label>
              <Input type="number" value={form.sale_price} onChange={(e) => setForm(f => ({ ...f, sale_price: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Giá gốc</Label>
              <Input type="number" value={form.original_price} onChange={(e) => setForm(f => ({ ...f, original_price: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Mô tả</Label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Link embed (Google Sheet)</Label>
              <Input value={form.google_sheet_embed_url} onChange={(e) => setForm(f => ({ ...f, google_sheet_embed_url: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Link copy (Google Sheet)</Label>
              <Input value={form.google_sheet_copy_url} onChange={(e) => setForm(f => ({ ...f, google_sheet_copy_url: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Link video hướng dẫn</Label>
              <Input value={form.tutorial_video_url} onChange={(e) => setForm(f => ({ ...f, tutorial_video_url: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tags (cách nhau bởi dấu phẩy)</Label>
              <Input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="VD: pháp luật, timeline" />
            </div>
            <div className="space-y-1.5">
              <Label>Thứ tự</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hiển thị</span>
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Ảnh chính</Label>
              <ImageUpload
                value={form.thumbnail_url}
                onChange={(url) => setForm(f => ({ ...f, thumbnail_url: url }))}
                onClear={() => setForm(f => ({ ...f, thumbnail_url: '' }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ảnh gallery</Label>
              <GalleryUpload
                values={form.gallery_urls}
                onChange={(urls) => setForm(f => ({ ...f, gallery_urls: urls }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (mode === 'edit' && selected ? setMode('view') : closeModal())}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all inline-flex items-center gap-1">
          {value} <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ) : (
        <p className="text-gray-700 dark:text-gray-200 text-sm whitespace-pre-wrap">{value}</p>
      )}
    </div>
  )
}
