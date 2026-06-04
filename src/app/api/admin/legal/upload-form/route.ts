import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveFormStorage } from '@/lib/legal/forms-storage'

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'word' | 'excel' | null
  // doc + formFile xác định ĐÚNG đường dẫn lưu để đè link tải của người dùng.
  // Mặc định tt99 + tên file gốc (giữ tương thích với hành vi cũ).
  const doc = (formData.get('doc') as string | null) ?? 'tt99'
  const formFile = (formData.get('formFile') as string | null) ?? (file ? file.name : null)

  if (!file || !type || !formFile) {
    return NextResponse.json({ error: 'Thiếu file, type hoặc formFile' }, { status: 400 })
  }

  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
  ]
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(docx|xlsx|doc|xls)$/i)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận file Word (.docx) hoặc Excel (.xlsx)' }, { status: 400 })
  }

  // Lưu theo tên đích chuẩn (không phụ thuộc tên file admin chọn) để đè đúng file người dùng tải.
  const { path } = resolveFormStorage(doc, formFile, type)

  const supabase = createAdminClient()
  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage.from('legal-forms').upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('legal-forms').getPublicUrl(path)
  return NextResponse.json({ success: true, url: urlData.publicUrl, path })
}
