'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Eye, EyeOff, ImageIcon, ExternalLink } from 'lucide-react'
import type { NewsPost } from '@/lib/supabase/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/admin/rich-text-editor'

type Mode = 'closed' | 'create' | 'view' | 'edit'

const EMPTY_FORM = {
  title: '',
  post_type: 'tin_tuc' as 'tin_tuc' | 'quang_cao',
  category: '',
  excerpt: '',
  cover_image_url: null as string | null,
  author_name: 'KKhome',
  tags: '',
  content: '',
  is_published: false,
}
type FormState = typeof EMPTY_FORM

function toForm(p: NewsPost): FormState {
  return {
    title: p.title,
    post_type: p.post_type,
    category: p.category ?? '',
    excerpt: p.excerpt ?? '',
    cover_image_url: p.cover_image_url,
    author_name: p.author_name ?? '',
    tags: (p.tags ?? []).join(', '),
    content: p.content,
    is_published: p.is_published,
  }
}

const TYPE_LABEL: Record<string, string> = { tin_tuc: 'Tin tức', quang_cao: 'Quảng cáo' }

export function NewsManager({ initialPosts }: { initialPosts: NewsPost[] }) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts)
  const [mode, setMode] = useState<Mode>('closed')
  const [selected, setSelected] = useState<NewsPost | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setMode('create')
  }

  function openView(p: NewsPost) {
    setSelected(p)
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

  async function togglePublish(p: NewsPost, e: React.MouseEvent) {
    e.stopPropagation()
    const next = !p.is_published
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, is_published: next } : x))
    const res = await fetch(`/api/admin/news/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: next }),
    })
    if (!res.ok) {
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, is_published: !next } : x))
      toast.error('Cập nhật thất bại')
      return
    }
    const data = await res.json()
    setPosts(prev => prev.map(x => x.id === p.id ? data : x))
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Tiêu đề không được để trống'); return }

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      post_type: form.post_type,
      category: form.category.trim() || null,
      excerpt: form.excerpt.trim() || null,
      cover_image_url: form.cover_image_url || null,
      author_name: form.author_name.trim() || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : null,
      content: form.content,
      is_published: form.is_published,
    }

    try {
      const res = mode === 'edit' && selected
        ? await fetch(`/api/admin/news/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (mode === 'edit' && selected) {
        setPosts(prev => prev.map(p => p.id === selected.id ? data : p))
        toast.success('Đã cập nhật')
      } else {
        setPosts(prev => [data, ...prev])
        toast.success('Đã thêm bài viết')
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
    if (!confirm(`Xóa bài viết "${selected.title}"?`)) return

    try {
      const res = await fetch(`/api/admin/news/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xóa thất bại')
      setPosts(prev => prev.filter(p => p.id !== selected.id))
      toast.success('Đã xóa')
      closeModal()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{posts.length} bài viết</p>
        <Button onClick={openCreate} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Viết bài mới
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
              <th className="w-14 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Ảnh</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Tiêu đề</th>
              <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Loại</th>
              <th className="w-32 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Danh mục</th>
              <th className="w-32 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Ngày đăng</th>
              <th className="w-24 px-3 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr
                key={p.id}
                onClick={() => openView(p)}
                className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="px-3 py-2">
                  {p.cover_image_url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image src={p.cover_image_url} alt={p.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{p.title}</td>
                <td className="px-3 py-2">
                  <Badge variant={p.post_type === 'quang_cao' ? 'secondary' : 'outline'}>{TYPE_LABEL[p.post_type]}</Badge>
                </td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{p.category || '—'}</td>
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString('vi-VN') : 'Nháp'}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={(e) => togglePublish(p, e)}
                    className={`p-1.5 rounded-lg transition-colors ${p.is_published ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-950/40 hover:bg-green-100 dark:hover:bg-emerald-950/60' : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    title={p.is_published ? 'Đang hiển thị' : 'Đang ẩn'}
                  >
                    {p.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  Chưa có bài viết nào. Nhấn &quot;Viết bài mới&quot; để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết */}
      <Dialog open={mode === 'view'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {selected.cover_image_url && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image src={selected.cover_image_url} alt={selected.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selected.post_type === 'quang_cao' ? 'secondary' : 'outline'}>{TYPE_LABEL[selected.post_type]}</Badge>
                  {selected.category && <Badge variant="outline">{selected.category}</Badge>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selected.is_published ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                    {selected.is_published ? 'Đang hiển thị' : 'Đang ẩn'}
                  </span>
                </div>
                {selected.excerpt && <p className="text-sm text-gray-600 dark:text-gray-300">{selected.excerpt}</p>}
                {selected.is_published && (
                  <a
                    href={`/tin-tuc/${selected.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> /tin-tuc/{selected.slug}
                  </a>
                )}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none border-t border-gray-100 dark:border-gray-800 pt-3"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
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
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Ưu đãi tháng 8 cho khách hàng mới" />
            </div>
            <div className="space-y-1.5">
              <Label>Loại bài</Label>
              <select
                value={form.post_type}
                onChange={(e) => setForm(f => ({ ...f, post_type: e.target.value as 'tin_tuc' | 'quang_cao' }))}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
                <option value="tin_tuc">Tin tức</option>
                <option value="quang_cao">Quảng cáo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="VD: Khuyến mãi, Hướng dẫn" />
            </div>
            <div className="space-y-1.5">
              <Label>Tác giả</Label>
              <Input value={form.author_name} onChange={(e) => setForm(f => ({ ...f, author_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (cách nhau bởi dấu phẩy)</Label>
              <Input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="VD: kế toán, ưu đãi" />
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <Label>Tóm tắt</Label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                value={form.excerpt}
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Hiển thị trên card danh sách bài viết"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ảnh bìa</Label>
              <ImageUpload
                value={form.cover_image_url}
                onChange={(url) => setForm(f => ({ ...f, cover_image_url: url }))}
                onClear={() => setForm(f => ({ ...f, cover_image_url: '' }))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hiển thị công khai</span>
              </label>
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <Label>Nội dung</Label>
              <RichTextEditor
                key={selected?.id ?? 'new'}
                content={form.content}
                onChange={(html) => setForm(f => ({ ...f, content: html }))}
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
