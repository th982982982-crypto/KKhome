'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Check, X, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { formatCurrency } from '@/lib/format'
import type { PromotionWithTemplates } from '@/lib/supabase/types'
import type { Template } from '@/lib/supabase/types'

interface Props {
  initialPromotions: PromotionWithTemplates[]
  templates: Pick<Template, 'id' | 'name' | 'sku'>[]
}

const EMPTY_FORM = {
  name: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: 10,
  start_at: '',
  end_at: '',
  apply_to: 'all' as 'all' | 'selected',
  is_active: true,
  template_ids: [] as string[],
}

function promoStatus(p: PromotionWithTemplates): 'active' | 'upcoming' | 'expired' | 'inactive' {
  if (!p.is_active) return 'inactive'
  const now = Date.now()
  const start = new Date(p.start_at).getTime()
  const end = new Date(p.end_at).getTime()
  if (now < start) return 'upcoming'
  if (now > end) return 'expired'
  return 'active'
}

export function PromotionManager({ initialPromotions, templates }: Props) {
  const [promotions, setPromotions] = useState(initialPromotions)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditId(null)
    const now = new Date()
    const later = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
    setForm({
      ...EMPTY_FORM,
      start_at: toLocalDatetimeString(now),
      end_at: toLocalDatetimeString(later),
    })
    setShowForm(true)
  }

  function openEdit(p: PromotionWithTemplates) {
    setEditId(p.id)
    setForm({
      name: p.name,
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      start_at: toLocalDatetimeString(new Date(p.start_at)),
      end_at: toLocalDatetimeString(new Date(p.end_at)),
      apply_to: p.apply_to,
      is_active: p.is_active,
      template_ids: p.template_ids,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên khuyến mãi'); return }
    if (!form.start_at || !form.end_at) { toast.error('Vui lòng chọn thời gian'); return }
    if (new Date(form.end_at) <= new Date(form.start_at)) { toast.error('Thời gian kết thúc phải sau thời gian bắt đầu'); return }
    setSaving(true)
    try {
      const body = {
        name: form.name,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        apply_to: form.apply_to,
        is_active: form.is_active,
        template_ids: form.apply_to === 'selected' ? form.template_ids : [],
      }
      let res: Response
      let data: PromotionWithTemplates
      if (editId) {
        res = await fetch(`/api/admin/promotions/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPromotions(prev => prev.map(p => p.id === editId ? data : p))
        toast.success('Đã cập nhật khuyến mãi')
      } else {
        res = await fetch('/api/admin/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPromotions(prev => [data, ...prev])
        toast.success('Đã tạo khuyến mãi')
      }
      setShowForm(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa khuyến mãi này?')) return
    const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPromotions(prev => prev.filter(p => p.id !== id))
      toast.success('Đã xóa')
    }
  }

  function toggleTemplate(tid: string) {
    setForm(f => ({
      ...f,
      template_ids: f.template_ids.includes(tid)
        ? f.template_ids.filter(id => id !== tid)
        : [...f.template_ids, tid],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{promotions.length} chương trình khuyến mãi</p>
        <Button onClick={openCreate} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tạo khuyến mãi
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-50">{editId ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tên chương trình</Label>
              <Input placeholder="VD: Sale cuối tháng 5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Loại giảm giá</Label>
              <div className="flex gap-2">
                {(['percent', 'fixed'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, discount_type: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.discount_type === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}
                  >
                    {t === 'percent' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mức giảm {form.discount_type === 'percent' ? '(%)' : '(VNĐ)'}</Label>
              <Input type="number" min={1} max={form.discount_type === 'percent' ? 99 : undefined} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Bắt đầu</Label>
              <Input type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kết thúc</Label>
              <Input type="datetime-local" value={form.end_at} onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Áp dụng cho</Label>
              <div className="flex gap-2">
                {(['all', 'selected'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, apply_to: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.apply_to === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}
                  >
                    {t === 'all' ? 'Tất cả templates' : 'Chọn từng template'}
                  </button>
                ))}
              </div>
            </div>
            {form.apply_to === 'selected' && (
              <div className="sm:col-span-2 space-y-2">
                <Label>Chọn templates ({form.template_ids.length} đã chọn)</Label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {templates.map(t => (
                    <label key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <input type="checkbox" checked={form.template_ids.includes(t.id)} onChange={() => toggleTemplate(t.id)} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{t.name}</span>
                      {t.sku && <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">{t.sku}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt ngay</Label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl gap-2">
              <Check className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl gap-2">
              <X className="w-4 h-4" /> Hủy
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promotions.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Tag className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>Chưa có khuyến mãi nào. Nhấn &quot;Tạo khuyến mãi&quot; để bắt đầu.</p>
          </div>
        )}
        {promotions.map(p => {
          const status = promoStatus(p)
          const statusConfig = {
            active: { label: 'Đang chạy', class: 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-300' },
            upcoming: { label: 'Sắp diễn ra', class: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
            expired: { label: 'Đã kết thúc', class: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
            inactive: { label: 'Tắt', class: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
          }[status]
          return (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusConfig.class}`}>{statusConfig.label}</span>
                  <h3 className="font-bold text-gray-900 dark:text-gray-50 truncate">{p.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {p.discount_type === 'percent' ? `-${p.discount_value}%` : `-${formatCurrency(p.discount_value)}`}
                  </span>
                  <span>•</span>
                  <span>{p.apply_to === 'all' ? 'Tất cả templates' : `${p.template_ids.length} templates`}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(p.start_at).toLocaleDateString('vi-VN')} → {new Date(p.end_at).toLocaleDateString('vi-VN')}
                  </span>
                  {status === 'active' && (
                    <>
                      <span>•</span>
                      <CountdownTimer endAt={p.end_at} className="text-red-600 dark:text-red-400 font-semibold text-xs" />
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-colors" title="Chỉnh sửa">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
