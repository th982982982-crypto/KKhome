'use client'

import { useRef, useState } from 'react'
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseXmlText } from '@/lib/tax/xml-parser'

function isGiayNopTien(xml: string): boolean {
  return /<CHUNGTU_HDR[\s>]/i.test(xml)
}

interface UploadStatus {
  name: string
  state: 'parsing' | 'uploading' | 'done' | 'error'
  info?: string
  error?: string
}

interface TaxUploadWidgetProps {
  onUploaded: () => void
}

export function TaxUploadWidget({ onUploaded }: TaxUploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [statuses, setStatuses] = useState<UploadStatus[]>([])
  const [dragging, setDragging] = useState(false)

  function setStatus(name: string, update: Partial<UploadStatus>) {
    setStatuses((prev) =>
      prev.map((s) => (s.name === name ? { ...s, ...update } : s))
    )
  }

  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.name.endsWith('.xml'))
    if (!arr.length) return

    const initial: UploadStatus[] = arr.map((f) => ({ name: f.name, state: 'parsing' }))
    setStatuses((prev) => {
      const existing = new Set(prev.map((s) => s.name))
      return [...prev, ...initial.filter((s) => !existing.has(s.name))]
    })

    for (const file of arr) {
      try {
        const text = await file.text()

        let info: string
        let endpoint: string

        if (isGiayNopTien(text)) {
          // Auto-detect Giấy nộp tiền → route sang endpoint GNT
          endpoint = '/api/tax/payments/upload'
          info = 'Giấy nộp tiền'
        } else {
          const parsed = parseXmlText(text)
          endpoint = '/api/tax/upload'
          info = `${parsed.declarationType} | ${parsed.mst} | ${parsed.kyKKhai}`
        }

        setStatus(file.name, { state: 'uploading', info })

        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(endpoint, { method: 'POST', body: fd })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error ?? 'Upload thất bại')
        }
        setStatus(file.name, { state: 'done' })
      } catch (err) {
        setStatus(file.name, {
          state: 'error',
          error: err instanceof Error ? err.message : 'Lỗi không xác định',
        })
      }
    }

    const allDone = statuses.every((s) => s.state === 'done' || s.state === 'error')
    if (allDone) onUploaded()
    else setTimeout(onUploaded, 500)
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Kéo thả file XML hoặc nhấn để chọn
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Hỗ trợ: GTGT (01/GTGT), TNDN, TNCN — nhiều file cùng lúc
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {statuses.length > 0 && (
        <div className="mt-3 space-y-2">
          {statuses.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm"
            >
              {s.state === 'parsing' || s.state === 'uploading' ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
              ) : s.state === 'done' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-50 truncate">{s.name}</p>
                {s.info && <p className="text-xs text-gray-400">{s.info}</p>}
                {s.error && <p className="text-xs text-red-500">{s.error}</p>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setStatuses((prev) => prev.filter((x) => x.name !== s.name)) }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
