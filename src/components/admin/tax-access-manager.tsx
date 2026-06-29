'use client'

import { useState } from 'react'
import { Shield, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  tax_access_until: string | null
}

function formatExpiry(until: string | null): string {
  if (!until) return '—'
  const t = new Date(until).getTime()
  if (!Number.isFinite(t)) return 'Vĩnh viễn'
  if (t < Date.now()) return `Hết hạn (${new Date(until).toLocaleDateString('vi-VN')})`
  return `Đến ${new Date(until).toLocaleDateString('vi-VN')}`
}

function hasAccess(u: UserRow): boolean {
  if (u.is_admin) return true
  if (!u.tax_access_until) return false
  const t = new Date(u.tax_access_until).getTime()
  return Number.isFinite(t) ? t > Date.now() : true
}

export function TaxAccessManager({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [grantUntil, setGrantUntil] = useState<Record<string, string>>({})

  async function grantAccess(userId: string) {
    const dateStr = grantUntil[userId]
    if (!dateStr) { toast.error('Chọn ngày hết hạn trước'); return }
    setLoading(userId)
    try {
      const until = new Date(dateStr).toISOString()
      const res = await fetch('/api/admin/tax-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tax_access_until: until }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: until } : u)))
      toast.success('Đã cấp quyền')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  async function revokeAccess(userId: string) {
    if (!confirm('Thu hồi quyền Tờ Khai Thuế của user này?')) return
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/tax-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tax_access_until: null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: null } : u)))
      toast.success('Đã thu hồi quyền')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  const grantedCount = rows.filter(hasAccess).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        <Shield className="w-4 h-4 shrink-0" />
        <span><strong>{grantedCount}</strong> / <strong>{rows.length}</strong> người dùng có quyền Tờ Khai Thuế</span>
      </div>

      <div className="space-y-2">
        {rows.map((u) => {
          const active = hasAccess(u)
          return (
            <div key={u.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">{u.email}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {u.full_name && <span>{u.full_name} •</span>}
                  <CalendarDays className="w-3 h-3" />
                  {u.is_admin ? 'Admin (luôn có quyền)' : formatExpiry(u.tax_access_until)}
                </p>
              </div>
              {!u.is_admin && (
                <div className="flex items-center gap-2 shrink-0">
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
                    {loading === u.id ? '...' : 'Cấp'}
                  </button>
                  {active && (
                    <button
                      onClick={() => revokeAccess(u.id)}
                      disabled={loading === u.id}
                      className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg font-bold border border-red-200 dark:border-red-800 disabled:opacity-50"
                    >
                      Thu hồi
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
