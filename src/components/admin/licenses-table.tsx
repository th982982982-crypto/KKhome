'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, ExternalLink } from 'lucide-react'

interface LicenseRow {
  id: string
  license_key: string
  email: string
  status: string
  created_at: string
  templates: { name: string; google_sheet_copy_url: string | null } | null
}

export function LicensesTable({ licenses: initial }: { licenses: LicenseRow[] }) {
  const [licenses, setLicenses] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'revoked'>('all')

  const filtered = filter === 'all' ? licenses : licenses.filter((l) => l.status === filter)

  async function updateStatus(id: string, status: 'active' | 'suspended' | 'revoked') {
    setLoadingId(id)
    const res = await fetch('/api/admin/licenses/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_id: id, status }),
    })
    const data = await res.json()
    if (data.success) {
      setLicenses((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
      toast.success('Đã cập nhật trạng thái license')
    } else {
      toast.error(data.error || 'Có lỗi xảy ra')
    }
    setLoadingId(null)
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Đang hoạt động' },
    { key: 'suspended', label: 'Tạm khóa' },
    { key: 'revoked', label: 'Đã thu hồi' },
  ]

  const counts = {
    all: licenses.length,
    active: licenses.filter((l) => l.status === 'active').length,
    suspended: licenses.filter((l) => l.status === 'suspended').length,
    revoked: licenses.filter((l) => l.status === 'revoked').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95
              ${filter === tab.key
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Template</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Email khách</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">License Key</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Trạng thái</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap sticky right-0 bg-gray-50 dark:bg-gray-900/60 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.1)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((license) => (
                <tr key={license.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{license.templates?.name ?? '—'}</span>
                      {license.templates?.google_sheet_copy_url && (
                        <a href={license.templates.google_sheet_copy_url} target="_blank" rel="noreferrer"
                          className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{license.email}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(license.email); toast.success('Đã copy email') }}
                        className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{license.license_key}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(license.license_key); toast.success('Đã copy license key') }}
                        className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <Badge
                      variant={license.status === 'active' ? 'default' : license.status === 'revoked' ? 'destructive' : 'secondary'}
                    >
                      {license.status === 'active' ? 'Hoạt động' : license.status === 'suspended' ? 'Tạm khóa' : 'Thu hồi'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {new Date(license.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center gap-1.5">
                      {license.status !== 'active' && (
                        <Button size="sm" variant="outline"
                          className="h-7 px-2 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/40 dark:bg-transparent whitespace-nowrap"
                          onClick={() => updateStatus(license.id, 'active')}
                          disabled={loadingId === license.id}
                        >
                          Kích hoạt
                        </Button>
                      )}
                      {license.status === 'active' && (
                        <Button size="sm" variant="outline"
                          className="h-7 px-2 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:bg-transparent whitespace-nowrap"
                          onClick={() => updateStatus(license.id, 'suspended')}
                          disabled={loadingId === license.id}
                        >
                          Tạm khóa
                        </Button>
                      )}
                      {license.status !== 'revoked' && (
                        <Button size="sm" variant="outline"
                          className="h-7 px-2 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 dark:bg-transparent whitespace-nowrap"
                          onClick={() => updateStatus(license.id, 'revoked')}
                          disabled={loadingId === license.id}
                        >
                          Thu hồi
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Không có license nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
