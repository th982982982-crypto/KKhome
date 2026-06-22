'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Check, X, ScrollText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { formatCurrency } from '@/lib/format'
import { isLegalPlanPromoActive } from '@/lib/supabase/types'
import type { LegalPlan } from '@/lib/supabase/types'

interface Props {
  initialPlans: LegalPlan[]
}

const DURATION_PRESETS = [1, 3, 6, 12]

const EMPTY_FORM = {
  name: '',
  duration_months: 1,
  price: 0,
  original_price: '' as number | '',
  promo_enabled: false,
  promo_price: '' as number | '',
  promo_start_at: '',
  promo_end_at: '',
  is_active: true,
  sort_order: 0,
}

type FormState = typeof EMPTY_FORM

function planStatus(p: LegalPlan): 'active' | 'promo' | 'inactive' {
  if (!p.is_active) return 'inactive'
  return isLegalPlanPromoActive(p) ? 'promo' : 'active'
}

export function LegalPlanManager({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditId(null)
    const now = new Date()
    const later = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
    setForm({
      ...EMPTY_FORM,
      sort_order: plans.length,
      promo_start_at: toLocalDatetimeString(now),
      promo_end_at: toLocalDatetimeString(later),
    })
    setShowForm(true)
  }

  function openEdit(p: LegalPlan) {
    setEditId(p.id)
    const hasPromo = p.promo_price != null && !!p.promo_start_at && !!p.promo_end_at
    setForm({
      name: p.name,
      duration_months: p.duration_months,
      price: p.price,
      original_price: p.original_price ?? '',
      promo_enabled: hasPromo,
      promo_price: p.promo_price ?? '',
      promo_start_at: p.promo_start_at ? toLocalDatetimeString(new Date(p.promo_start_at)) : '',
      promo_end_at: p.promo_end_at ? toLocalDatetimeString(new Date(p.promo_end_at)) : '',
      is_active: p.is_active,
      sort_order: p.sort_order,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên gói'); return }
    if (!form.duration_months || form.duration_months < 1) { toast.error('Thời hạn phải ≥ 1 tháng'); return }
    if (form.price < 0) { toast.error('Giá không hợp lệ'); return }
    if (form.promo_enabled) {
      if (form.promo_price === '' || Number(form.promo_price) < 0) { toast.error('Vui lòng nhập giá khuyến mãi'); return }
      if (!form.promo_start_at || !form.promo_end_at) { toast.error('Vui lòng chọn thời gian khuyến mãi'); return }
      if (new Date(form.promo_end_at) <= new Date(form.promo_start_at)) { toast.error('Thời gian kết thúc phải sau thời gian bắt đầu'); return }
    }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        duration_months: Number(form.duration_months),
        price: Number(form.price),
        original_price: form.original_price === '' ? null : Number(form.original_price),
        promo_price: form.promo_enabled && form.promo_price !== '' ? Number(form.promo_price) : null,
        promo_start_at: form.promo_enabled ? new Date(form.promo_start_at).toISOString() : null,
        promo_end_at: form.promo_enabled ? new Date(form.promo_end_at).toISOString() : null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      }
      let res: Response
      let data: LegalPlan
      if (editId) {
        res = await fetch(`/api/admin/legal-plans/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPlans(prev => prev.map(p => p.id === editId ? data : p))
        toast.success('Đã cập nhật gói')
      } else {
        res = await fetch('/api/admin/legal-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPlans(prev => [...prev, data])
        toast.success('Đã tạo gói')
      }
      setShowForm(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa gói này? (Nên tắt kích hoạt thay vì xóa nếu gói đang nằm trong đơn chờ duyệt)')) return
    const res = await fetch(`/api/admin/legal-plans/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlans(prev => prev.filter(p => p.id !== id))
      toast.success('Đã xóa')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Xóa thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{plans.length} gói bán quyền Pháp luật</p>
        <Button onClick={openCreate} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tạo gói
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-50">{editId ? 'Chỉnh sửa gói' : 'Tạo gói mới'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tên gói</Label>
              <Input placeholder="VD: Gói 3 tháng" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Thời hạn (tháng)</Label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_PRESETS.map(m => (
                  <button key={m} onClick={() => setForm(f => ({ ...f, duration_months: m }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.duration_months === m ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'}`}
                  >
                    {m} tháng
                  </button>
                ))}
                <Input type="number" min={1} className="w-28" value={form.duration_months} onChange={e => setForm(f => ({ ...f, duration_months: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Giá bán (VNĐ)</Label>
              <Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Giá gốc (gạch ngang, tùy chọn)</Label>
              <Input type="number" min={0} placeholder="Để trống nếu không có" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <input type="checkbox" id="promo_enabled" checked={form.promo_enabled} onChange={e => setForm(f => ({ ...f, promo_enabled: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
              <Label htmlFor="promo_enabled" className="cursor-pointer">Khuyến mãi có thời hạn (đếm ngược)</Label>
            </div>
            {form.promo_enabled && (
              <>
                <div className="space-y-1.5">
                  <Label>Giá khuyến mãi (VNĐ)</Label>
                  <Input type="number" min={0} value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: e.target.value === '' ? '' : Number(e.target.value) }))} />
                </div>
                <div className="hidden sm:block" />
                <div className="space-y-1.5">
                  <Label>Bắt đầu KM</Label>
                  <Input type="datetime-local" value={form.promo_start_at} onChange={e => setForm(f => ({ ...f, promo_start_at: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kết thúc KM</Label>
                  <Input type="datetime-local" value={form.promo_end_at} onChange={e => setForm(f => ({ ...f, promo_end_at: e.target.value }))} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Thứ tự hiển thị</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt (hiển thị cho khách)</Label>
              </div>
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
        {plans.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <ScrollText className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>Chưa có gói nào. Nhấn &quot;Tạo gói&quot; để bắt đầu.</p>
          </div>
        )}
        {plans.map(p => {
          const status = planStatus(p)
          const statusConfig = {
            active: { label: 'Đang bán', class: 'bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-300' },
            promo: { label: 'Đang KM', class: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
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
                  <span>Truy cập {p.duration_months} tháng</span>
                  <span>•</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {status === 'promo' && p.promo_price != null
                      ? <>{formatCurrency(p.promo_price)} <span className="line-through text-gray-400 font-normal">{formatCurrency(p.price)}</span></>
                      : formatCurrency(p.price)}
                  </span>
                  {status === 'promo' && p.promo_end_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(p.promo_start_at!).toLocaleDateString('vi-VN')} → {new Date(p.promo_end_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span>•</span>
                      <CountdownTimer endAt={p.promo_end_at} className="text-red-600 dark:text-red-400 font-semibold text-xs" />
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
