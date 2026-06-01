'use client'

import { useState } from 'react'
import { Shield, Check, X } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  can_view_legal: boolean
}

interface LegalAccessManagerProps {
  users: UserRow[]
}

export function LegalAccessManager({ users }: LegalAccessManagerProps) {
  const [rows, setRows] = useState<UserRow[]>(users)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleAccess(userId: string, current: boolean) {
    setLoading(userId)
    setError(null)

    // Optimistic update
    setRows((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, can_view_legal: !current } : u))
    )

    try {
      const res = await fetch('/api/admin/legal-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, can_view_legal: !current }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Lỗi không xác định')
      }
    } catch (err) {
      // Rollback
      setRows((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, can_view_legal: current } : u))
      )
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(null)
    }
  }

  const grantedCount = rows.filter((u) => u.can_view_legal || u.is_admin).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          <strong>{grantedCount}</strong> / <strong>{rows.length}</strong> người dùng có quyền xem văn bản pháp luật
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Người dùng</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Email</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Vai trò</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Xem Pháp luật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 shrink-0">
                      {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {user.full_name || user.email?.split('@')[0] || 'Ẩn danh'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 sm:hidden truncate">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  <span className="truncate max-w-48 block">{user.email}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.is_admin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Người dùng</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {user.is_admin ? (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-950/50 mx-auto" title="Admin luôn có quyền">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleAccess(user.id, user.can_view_legal)}
                      disabled={loading === user.id}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 mx-auto block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                        user.can_view_legal
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      } ${loading === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      aria-label={user.can_view_legal ? 'Thu hồi quyền' : 'Cấp quyền'}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          user.can_view_legal ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  Chưa có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Admin luôn có quyền xem tất cả văn bản pháp luật mà không cần cấp riêng.
      </p>
    </div>
  )
}
