'use client'

import { useMemo, useRef, useState } from 'react'
import { FORMS_BY_DOC, FORMS_DOC_ORDER, TOTAL_FORMS, type FormItem } from '@/lib/legal/forms-registry'
import { Upload, CheckCircle, AlertCircle, Search, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message?: string
}

export function FormsManager() {
  const [activeDoc, setActiveDoc] = useState<string>(FORMS_DOC_ORDER[0])
  const [search, setSearch] = useState('')
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const doc = FORMS_BY_DOC[activeDoc]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return doc.forms
    return doc.forms.filter((f) => f.code.toLowerCase().includes(q) || f.title.toLowerCase().includes(q))
  }, [doc, search])

  // Nhóm theo group (Phụ lục với TT99; các văn bản khác chỉ 1 nhóm "Biểu mẫu")
  const grouped = useMemo(() => {
    const acc: Record<string, FormItem[]> = {}
    for (const f of filtered) {
      const key = f.groupLabel || 'Biểu mẫu'
      ;(acc[key] = acc[key] ?? []).push(f)
    }
    return acc
  }, [filtered])

  async function handleUpload(form: FormItem, type: 'word' | 'excel', file: File) {
    const key = `${activeDoc}-${form.code}-${type}`
    setUploadStates((s) => ({ ...s, [key]: { status: 'uploading' } }))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    fd.append('doc', activeDoc)
    fd.append('formFile', form.file)

    try {
      const res = await fetch('/api/admin/legal/upload-form', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadStates((s) => ({ ...s, [key]: { status: 'success', message: 'Đã upload thành công' } }))
      setTimeout(() => setUploadStates((s) => ({ ...s, [key]: { status: 'idle' } })), 3000)
    } catch (err) {
      setUploadStates((s) => ({
        ...s,
        [key]: { status: 'error', message: err instanceof Error ? err.message : 'Lỗi upload' },
      }))
    }
  }

  function UploadBtn({ form, type, label, icon: Icon, accept }: {
    form: FormItem
    type: 'word' | 'excel'
    label: string
    icon: typeof FileText
    accept: string
  }) {
    const key = `${activeDoc}-${form.code}-${type}`
    const state = uploadStates[key] ?? { status: 'idle' }
    const inputId = `upload-${key}`

    return (
      <label htmlFor={inputId} className="cursor-pointer">
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          ref={(el) => { fileInputRefs.current[inputId] = el }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(form, type, file)
            e.target.value = ''
          }}
        />
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            state.status === 'uploading'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed pointer-events-none'
              : state.status === 'success'
              ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
              : state.status === 'error'
              ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
              : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
          }`}
          title={state.message}
        >
          {state.status === 'uploading' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : state.status === 'success' ? (
            <CheckCircle className="w-3 h-3" />
          ) : state.status === 'error' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <><Icon className="w-3 h-3" /><Upload className="w-3 h-3" /></>
          )}
          {state.status === 'idle' && label}
          {state.status === 'uploading' && 'Đang upload...'}
          {state.status === 'success' && 'Thành công'}
          {state.status === 'error' && 'Lỗi'}
        </span>
      </label>
    )
  }

  return (
    <div className="space-y-6">
      {/* Doc selector */}
      <div className="flex flex-wrap gap-1.5">
        {FORMS_DOC_ORDER.map((slug) => {
          const d = FORMS_BY_DOC[slug]
          const active = slug === activeDoc
          return (
            <button
              key={slug}
              onClick={() => { setActiveDoc(slug); setSearch('') }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
              title={d.fullLabel}
            >
              {d.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                {d.forms.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active doc header */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{doc.label}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">— {doc.fullLabel}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Tìm biểu mẫu trong ${doc.label}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {filtered.length} / {doc.forms.length} biểu mẫu — tổng {TOTAL_FORMS} mẫu / {FORMS_DOC_ORDER.length} văn bản —{' '}
        <span className="text-blue-600 dark:text-blue-400">Upload mới sẽ ghi đè link tải về cho mẫu đó</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">Không tìm thấy biểu mẫu phù hợp</div>
      ) : (
        Object.entries(grouped).map(([groupLabel, forms]) => (
          <div key={groupLabel} className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 mb-2">
              {groupLabel}
            </h3>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-xs w-28">Mã</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-xs">Tên biểu mẫu</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-xs w-48">Upload mới (chỉ admin)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {forms.map((form) => (
                    <tr key={form.code} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded">
                          {form.code}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 text-xs leading-snug">
                        {form.title}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2">
                          <UploadBtn form={form} type="word" label="Word" icon={FileText}
                            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                          <UploadBtn form={form} type="excel" label="Excel" icon={FileSpreadsheet}
                            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
