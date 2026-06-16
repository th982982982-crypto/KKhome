'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save, ExternalLink, FileText } from 'lucide-react'
import type { Policy } from '@/lib/supabase/types'

const SLUG_ORDER = [
  'bao-mat',
  'xac-nhan-don-hang',
  'bao-hanh',
  'doi-tra',
  'thanh-toan',
  'gia',
]

export function PoliciesEditor({ policies }: { policies: Policy[] }) {
  const router = useRouter()
  const ordered = SLUG_ORDER
    .map(s => policies.find(p => p.slug === s))
    .filter(Boolean) as Policy[]

  const [activeSlug, setActiveSlug] = useState(ordered[0]?.slug ?? '')
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(policies.map(p => [p.slug, p.content]))
  )
  const [saving, setSaving] = useState(false)

  const active = ordered.find(p => p.slug === activeSlug)

  async function handleSave() {
    if (!activeSlug) return
    setSaving(true)
    const res = await fetch(`/api/admin/policies/${activeSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: contents[activeSlug] ?? '' }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      toast.error(data.error || 'Lưu thất bại')
      return
    }
    toast.success('Đã lưu')
    router.refresh()
  }

  return (
    <div className="flex gap-5 items-start">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2">
        {ordered.map(p => (
          <button
            key={p.slug}
            onClick={() => setActiveSlug(p.slug)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors
              ${activeSlug === p.slug
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-snug">{p.title}</span>
          </button>
        ))}
      </div>

      {/* Editor */}
      {active && (
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-50">{active.title}</h2>
              <a
                href={`/chinh-sach/${active.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> /chinh-sach/{active.slug}
              </a>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm px-4 h-9 rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
          <textarea
            value={contents[active.slug] ?? ''}
            onChange={e => setContents(c => ({ ...c, [active.slug]: e.target.value }))}
            rows={20}
            placeholder={`Nhập nội dung ${active.title}…`}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-y font-mono leading-relaxed"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Hỗ trợ xuống dòng. Nội dung hiển thị đúng định dạng trên trang chính sách.</p>
        </div>
      )}
    </div>
  )
}
