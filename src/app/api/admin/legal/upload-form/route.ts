import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'word' | 'excel' | null

  if (!file || !type) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
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

  const supabase = createAdminClient()
  const folder = type === 'word' ? 'word' : 'excel'
  const path = `${folder}/${file.name}`

  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('legal-forms')
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('legal-forms').getPublicUrl(path)
  return NextResponse.json({ success: true, url: urlData.publicUrl, path })
}
