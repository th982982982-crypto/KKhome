'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface GalleryUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
}

export function GalleryUpload({ values, onChange }: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        uploaded.push(await uploadToCloudinary(file))
      } catch {
        toast.error(`Upload thất bại: ${file.name}`)
      }
    }
    if (uploaded.length) {
      onChange([...values, ...uploaded])
      toast.success(`Đã tải lên ${uploaded.length} ảnh`)
    }
    setUploading(false)
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((url, i) => (
        <div key={url + i} className="relative group w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <Image src={url} alt="" fill className="object-cover" sizes="48px" />
          <button
            onClick={() => remove(i)}
            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Xóa"
            type="button"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="w-12 h-12 rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 disabled:opacity-50"
        title="Thêm ảnh"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
