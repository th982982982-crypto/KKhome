'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  onClear?: () => void
}

const CLOUD_NAME = 'dquitg1pa'
const UPLOAD_PRESET = 'KKhome'

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload thất bại')
  const data = await res.json()
  return data.secure_url as string
}

export function ImageUpload({ value, onChange, onClear }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Chỉ hỗ trợ file ảnh'); return }
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      onChange(url)
      toast.success('Đã tải ảnh lên')
    } catch {
      toast.error('Upload thất bại, thử lại')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  // Paste anywhere on the page when this component is mounted
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() { setDragging(false) }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50">
          <Image src={value} alt="thumbnail" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Đổi ảnh
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
            ${dragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
            ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <p className="text-xs text-gray-400">Đang tải lên...</p>
            </>
          ) : dragging ? (
            <>
              <Upload className="w-6 h-6 text-black" />
              <p className="text-xs text-black font-medium">Thả ảnh vào đây</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-gray-300" />
              <p className="text-xs text-gray-400 text-center px-2">
                Kéo thả, dán <kbd className="bg-gray-100 px-1 rounded text-gray-500">Ctrl+V</kbd>, hoặc click
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
