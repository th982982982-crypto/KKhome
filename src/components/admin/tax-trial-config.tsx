'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Clock, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function TaxTrialConfig({ initialDays }: { initialDays: number }) {
  const [days, setDays] = useState(initialDays)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (days < 0) { toast.error('Số ngày phải ≥ 0'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tax_trial_days: days }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Đã lưu cấu hình dùng thử')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300 mb-1">Cấu hình dùng thử</h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
            Người dùng mới đăng ký sẽ được dùng thử miễn phí. Nhập 0 để tắt dùng thử.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-24 h-9 text-sm"
              />
              <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">ngày dùng thử</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
