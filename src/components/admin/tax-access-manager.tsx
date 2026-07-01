'use client'

import { useState } from 'react'
import { Shield, CalendarDays, FlaskConical, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  tax_access_until: string | null
  tax_trial_started_at: string | null
  tax_trial_count: number
  tax_trial_max_count: number
  tax_trial_bonus_days: number
}

interface Props {
  users: UserRow[]
  trialDays: number
}

function formatExpiry(until: string | null): string {
  if (!until) return '—'
  const t = new Date(until).getTime()
  if (!Number.isFinite(t)) return 'Vĩnh viễn'
  if (t < Date.now()) return `Hết hạn (${new Date(until).toLocaleDateString('vi-VN')})`
  return `Đến ${new Date(until).toLocaleDateString('vi-VN')}`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function getTrialInfo(u: UserRow, trialDays: number): { active: boolean; daysLeft: number; ended: boolean; endDate: string | null } {
  if (!u.tax_trial_started_at) return { active: false, daysLeft: 0, ended: false, endDate: null }
  const totalDays = trialDays + (u.tax_trial_bonus_days ?? 0)
  const trialEnd = new Date(u.tax_trial_started_at).getTime() + totalDays * 24 * 60 * 60 * 1000
  const remaining = trialEnd - Date.now()
  const endDateStr = new Date(trialEnd).toLocaleDateString('vi-VN')
  if (remaining > 0) {
    return { active: true, daysLeft: Math.ceil(remaining / (24 * 60 * 60 * 1000)), ended: false, endDate: endDateStr }
  }
  return { active: false, daysLeft: 0, ended: true, endDate: endDateStr }
}

function hasPaidAccess(u: UserRow): boolean {
  if (u.is_admin) return true
  if (!u.tax_access_until) return false
  const t = new Date(u.tax_access_until).getTime()
  return Number.isFinite(t) ? t > Date.now() : true
}

export function TaxAccessManager({ users, trialDays }: Props) {
  const [rows, setRows] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [grantUntil, setGrantUntil] = useState<Record<string, string>>({})
  const [extraDays, setExtraDays] = useState<Record<string, string>>({})

  async function patch(userId: string, body: object, loadingKey: string) {
    setLoading(loadingKey)
    try {
      const res = await fetch('/api/admin/tax-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...body }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      setLoading(null)
    }
  }

  async function grantAccess(userId: string) {
    const dateStr = grantUntil[userId]
    if (!dateStr) { toast.error('Chọn ngày hết hạn trước'); return }
    const until = new Date(dateStr).toISOString()
    if (await patch(userId, { tax_access_until: until }, userId)) {
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: until } : u)))
      toast.success('Đã cấp quyền')
    }
  }

  async function grantTrial(userId: string) {
    const now = new Date().toISOString()
    const user = rows.find(u => u.id === userId)!
    if (await patch(userId, { tax_trial_started_at: now, tax_trial_count: user.tax_trial_count + 1 }, `trial-${userId}`)) {
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_trial_started_at: now, tax_trial_count: u.tax_trial_count + 1 } : u)))
      toast.success(`Đã cấp ${trialDays} ngày dùng thử`)
    }
  }

  async function addTrialSlot(userId: string) {
    const user = rows.find(u => u.id === userId)!
    const newMax = user.tax_trial_max_count + 1
    // Reset trial để user tự bấm bắt đầu lại
    if (await patch(userId, { tax_trial_max_count: newMax, tax_trial_started_at: null }, `slot-${userId}`)) {
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_trial_max_count: newMax, tax_trial_started_at: null } : u)))
      toast.success('Đã mở thêm 1 lượt dùng thử cho user')
    }
  }

  async function addBonusDays(userId: string) {
    const days = parseInt(extraDays[userId] || '0', 10)
    if (!days || days <= 0) { toast.error('Nhập số ngày > 0'); return }
    const user = rows.find(u => u.id === userId)!
    const newBonus = user.tax_trial_bonus_days + days
    if (await patch(userId, { tax_trial_bonus_days: newBonus }, `bonus-${userId}`)) {
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_trial_bonus_days: newBonus } : u)))
      toast.success(`Đã thêm ${days} ngày thử cho user`)
      setExtraDays(prev => ({ ...prev, [userId]: '' }))
    }
  }

  async function revokeAccess(userId: string) {
    if (!confirm('Thu hồi quyền Tờ Khai Thuế của user này?')) return
    if (await patch(userId, { tax_access_until: null, tax_trial_started_at: null }, userId)) {
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: null, tax_trial_started_at: null } : u)))
      toast.success('Đã thu hồi quyền')
    }
  }

  const grantedCount = rows.filter((u) => u.is_admin || hasPaidAccess(u) || getTrialInfo(u, trialDays).active).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        <Shield className="w-4 h-4 shrink-0" />
        <span><strong>{grantedCount}</strong> / <strong>{rows.length}</strong> người dùng có quyền Tờ Khai Thuế</span>
      </div>

      <div className="space-y-2">
        {rows.map((u) => {
          const paid = hasPaidAccess(u)
          const trial = getTrialInfo(u, trialDays)
          const active = paid || trial.active
          const totalTrialDays = trialDays + u.tax_trial_bonus_days

          return (
            <div key={u.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 space-y-3">
              {/* Row 1: Status + user info */}
              <div className="flex flex-wrap items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">{u.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {u.is_admin ? (
                      <span className="text-xs text-gray-400">Admin (luôn có quyền)</span>
                    ) : (
                      <>
                        {paid && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatExpiry(u.tax_access_until)}
                          </span>
                        )}
                        {trial.active && (
                          <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            trial.daysLeft <= 3
                              ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          }`}>
                            <FlaskConical className="w-3 h-3" />
                            Dùng thử: còn {trial.daysLeft} ngày (đến {trial.endDate})
                          </span>
                        )}
                        {trial.ended && !paid && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" />
                            Dùng thử đã hết ({trial.endDate})
                          </span>
                        )}
                        {!paid && !trial.active && !trial.ended && (
                          <span className="text-xs text-gray-400">Chưa kích hoạt</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Trial stats + admin actions */}
              {!u.is_admin && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  {/* Trial stats */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" />
                      Lượt thử: <strong className="text-gray-700 dark:text-gray-200">{u.tax_trial_count}/{u.tax_trial_max_count}</strong>
                    </span>
                    {u.tax_trial_started_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Bắt đầu: <strong className="text-gray-700 dark:text-gray-200">{formatDate(u.tax_trial_started_at)}</strong>
                      </span>
                    )}
                    {trial.endDate && (
                      <span>Kết thúc: <strong className="text-gray-700 dark:text-gray-200">{trial.endDate}</strong></span>
                    )}
                    {u.tax_trial_bonus_days > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">+{u.tax_trial_bonus_days} ngày bonus ({totalTrialDays}N tổng)</span>
                    )}
                  </div>

                  {/* Admin action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      className="h-8 text-xs w-36"
                      value={grantUntil[u.id] ?? ''}
                      onChange={(e) => setGrantUntil((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => grantAccess(u.id)}
                      disabled={loading === u.id}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                      {loading === u.id ? '...' : 'Cấp quyền'}
                    </button>

                    <button
                      onClick={() => grantTrial(u.id)}
                      disabled={loading === `trial-${u.id}`}
                      title={`Admin bắt đầu ${trialDays} ngày dùng thử ngay`}
                      className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      {loading === `trial-${u.id}` ? '...' : `Thử ${trialDays}N`}
                    </button>

                    <button
                      onClick={() => addTrialSlot(u.id)}
                      disabled={loading === `slot-${u.id}`}
                      title="Cho user thêm 1 lượt tự bắt đầu dùng thử"
                      className="text-xs px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {loading === `slot-${u.id}` ? '...' : '+1 lượt thử'}
                    </button>

                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="ngày"
                        min={1}
                        className="h-8 text-xs w-16"
                        value={extraDays[u.id] ?? ''}
                        onChange={(e) => setExtraDays(prev => ({ ...prev, [u.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => addBonusDays(u.id)}
                        disabled={loading === `bonus-${u.id}`}
                        title="Thêm ngày vào lần thử hiện tại hoặc lần tiếp theo"
                        className="text-xs px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold disabled:opacity-50"
                      >
                        {loading === `bonus-${u.id}` ? '...' : '+Ngày thử'}
                      </button>
                    </div>

                    {active && (
                      <button
                        onClick={() => revokeAccess(u.id)}
                        disabled={!!loading}
                        className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg font-bold border border-red-200 dark:border-red-800 disabled:opacity-50"
                      >
                        Thu hồi
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
