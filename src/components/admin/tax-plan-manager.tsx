'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'
import type { TaxPlan } from '@/lib/supabase/types'

interface Props { initialPlans: TaxPlan[] }

const DURATION_PRESETS = [1, 3, 6, 12]

const EMPTY_FORM = {
  name: '',
  duration_months: 1,
  price: 0,
  original_price: '' as number | '',
  is_active: true,
  sort_order: 0,
}
type FormState = typeof EMPTY_FORM

export function TaxPlanManager({ initialPlans }: Props) {
  const [plans, setPlans] = useState(initialPlans)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, sort_order: plans.length })
    setShowForm(true)
  }

  function openEdit(p: TaxPlan) {
    setEditId(p.id)
    setForm({
      name: p.name,
      duration_months: p.duration_months,
      price: p.price,
      original_price: p.original_price ?? '',
      is_active: p.is_active,
      sort_order: p.sort_order,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nhập tên gói'); return }
    if (!form.duration_months || form.duration_months < 1) { toast.error('Thời hạn ≥ 1 tháng'); return }
    if (form.price < 0) { toast.error('Giá không hợp lệ'); return }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        duration_months: Number(form.duration_months),
        price: Number(form.price),
        original_price: form.original_price === '' ? null : Number(form.original_price),
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      }
      let res: Response
      let data: TaxPlan
      if (editId) {
        res = await fetch(`/api/admin/tax-plans/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPlans((prev) => prev.map((p) => (p.id === editId ? data : p)))
        toast.success('Đã cập nhật gói')
      } else {
        res = await fetch('/api/admin/tax-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        data = await res.json()
        if (!res.ok) throw new Error((data as unknown as { error: string }).error)
        setPlans((prev) => [...prev, data])
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
    if (!confirm('Xóa gói này?')) return
    const res = await fetch(`/api/admin/tax-plans/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id))
      toast.success('Đã xóa')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Xóa thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{plans.length} gói Tờ Khai Thuế</p>
        <Button onClick={openCreate} className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Tạo gói
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-50">{editId ? 'Chỉnh sửa gói' : 'Tạo gói mới'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tên gói</Label>
              <Input placeholder="VD: Gói 3 tháng" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Thời hạn (tháng)</Label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm((f) => ({ ...f, duration_months: m }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.duration_months === m ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {m} tháng
                  </button>
                ))}
                <Input type="number" min={1} className="w-28" value={form.duration_months} onChange={(e) => setForm((f) => ({ ...f, duration_months: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Giá bán (VNĐ)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Giá gốc (tùy chọn)</Label>
              <Input type="number" min={0} placeholder="Để trống nếu không có" value={form.original_price} onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Thứ tự</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kích hoạt</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
              <X className="w-4 h-4 mr-1" /> Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Check className="w-4 h-4 mr-1" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plans.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Chưa có gói nào. Tạo gói đầu tiên.</p>
        )}
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 dark:text-gray-50 truncate">{p.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.is_active ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {p.is_active ? 'Hoạt động' : 'Tắt'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {p.duration_months} tháng • {formatCurrency(p.price)}
                {p.original_price && <span className="ml-2 line-through text-gray-300">{formatCurrency(p.original_price)}</span>}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
