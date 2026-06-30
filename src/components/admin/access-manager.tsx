'use client'

import { useState } from 'react'
import { Shield, CalendarDays, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  legal_access_until: string | null
  tax_access_until: string | null
}

function formatExpiry(until: string | null, fallback = '—'): string {
  if (!until) return fallback
  const t = new Date(until).getTime()
  if (!Number.isFinite(t)) return 'Vĩnh viễn'
  if (t < Date.now()) return `Hết hạn`
  return `${new Date(until).toLocaleDateString('vi-VN')}`
}

function isActive(until: string | null): boolean {
  if (!until) return false
  const t = new Date(until).getTime()
  return !Number.isFinite(t) || t > Date.now()
}

export function AccessManager({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [taxDates, setTaxDates] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const filtered = rows.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Legal ──────────────────────────────────────────────────────────
  async function toggleLegal(userId: string, current: boolean) {
    setLoading(`legal-${userId}`)
    try {
      const res = await fetch('/api/admin/legal-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, can_view_legal: !current }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRows((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, legal_access_until: !current ? 'infinity' : null }
            : u
        )
      )
      toast.success(!current ? 'Đã cấp quyền Pháp luật' : 'Đã thu hồi quyền Pháp luật')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  // ── Tax ────────────────────────────────────────────────────────────
  async function grantTax(userId: string) {
    const dateStr = taxDates[userId]
    if (!dateStr) { toast.error('Chọn ngày hết hạn'); return }
    setLoading(`tax-${userId}`)
    try {
      const until = dateStr === 'infinity' ? 'infinity' : new Date(dateStr).toISOString()
      const res = await fetch('/api/admin/tax-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tax_access_until: until }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: until } : u)))
      toast.success('Đã cấp quyền Tờ Khai')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  async function revokeTax(userId: string) {
    if (!confirm('Thu hồi quyền Tờ Khai của user này?')) return
    setLoading(`tax-${userId}`)
    try {
      const res = await fetch('/api/admin/tax-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tax_access_until: null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, tax_access_until: null } : u)))
      toast.success('Đã thu hồi quyền Tờ Khai')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(null)
    }
  }

  const legalCount = rows.filter((u) => u.is_admin || isActive(u.legal_access_until)).length
  const taxCount = rows.filter((u) => u.is_admin || isActive(u.tax_access_until)).length

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <Shield className="w-4 h-4 shrink-0" />
          <div>
            <div className="font-bold text-lg">{legalCount}<span className="text-sm font-normal text-blue-500">/{rows.length}</span></div>
            <div className="text-xs">Có quyền Pháp luật</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
          <Shield className="w-4 h-4 shrink-0" />
          <div>
            <div className="font-bold text-lg">{taxCount}<span className="text-sm font-normal text-emerald-500">/{rows.length}</span></div>
            <div className="text-xs">Có quyền Tờ Khai</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Tìm theo email hoặc tên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Người dùng</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Vai trò</th>
              <th className="text-center px-6 py-3 font-semibold text-blue-600 dark:text-blue-400">Pháp luật</th>
              <th className="text-center px-6 py-3 font-semibold text-emerald-600 dark:text-emerald-400 min-w-[260px]">Tờ Khai Thuế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((u) => {
              const legalOn = u.is_admin || isActive(u.legal_access_until)
              const taxOn = u.is_admin || isActive(u.tax_access_until)
              return (
                <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 shrink-0">
                        {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-50 truncate max-w-[200px]">{u.full_name || u.email?.split('@')[0]}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 text-center">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Người dùng</span>
                    )}
                  </td>

                  {/* Legal toggle */}
                  <td className="px-6 py-3 text-center">
                    {u.is_admin ? (
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => toggleLegal(u.id, legalOn)}
                          disabled={loading === `legal-${u.id}`}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            legalOn ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          } ${loading === `legal-${u.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${legalOn ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-[10px] text-gray-400">{legalOn ? formatExpiry(u.legal_access_until, 'Vĩnh viễn') : '—'}</span>
                      </div>
                    )}
                  </td>

                  {/* Tax date picker + grant/revoke */}
                  <td className="px-6 py-3">
                    {u.is_admin ? (
                      <div className="flex justify-center"><Check className="w-4 h-4 text-green-500" /></div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <select
                            className="h-8 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2"
                            value={taxDates[u.id] ?? ''}
                            onChange={(e) => setTaxDates((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          >
                            <option value="">Chọn hạn...</option>
                            <option value="__date__">Chọn ngày cụ thể</option>
                            <option value="infinity">Vĩnh viễn</option>
                          </select>
                          {taxDates[u.id] === '__date__' && (
                            <Input
                              type="date"
                              className="h-8 text-xs w-32"
                              onChange={(e) => setTaxDates((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            />
                          )}
                          <button
                            onClick={() => grantTax(u.id)}
                            disabled={loading === `tax-${u.id}` || !taxDates[u.id] || taxDates[u.id] === '__date__'}
                            className="text-xs px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-40"
                          >
                            {loading === `tax-${u.id}` ? '...' : 'Cấp'}
                          </button>
                          {taxOn && (
                            <button
                              onClick={() => revokeTax(u.id)}
                              disabled={loading === `tax-${u.id}`}
                              className="text-xs px-2.5 py-1.5 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg font-bold border border-red-200 dark:border-red-800 disabled:opacity-50"
                            >
                              Thu hồi
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <CalendarDays className="w-3 h-3 text-gray-400" />
                          <span className={taxOn ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400'}>
                            {u.is_admin ? 'Vĩnh viễn' : taxOn ? formatExpiry(u.tax_access_until) : 'Chưa có quyền'}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                  {search ? 'Không tìm thấy user' : 'Chưa có người dùng'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
