import { NextResponse } from 'next/server'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveFormStorage } from '@/lib/legal/forms-storage'

const LEGAL_SCRIPT_URL = process.env.LEGAL_FORMS_SCRIPT_URL

const MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

async function getDriveUrl(file: string, type: 'word' | 'excel', doc: string): Promise<string | null> {
  if (!LEGAL_SCRIPT_URL) return null
  const url = `${LEGAL_SCRIPT_URL}?action=get_form_url&file=${encodeURIComponent(file)}&type=${type}&doc=${encodeURIComponent(doc)}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  } catch {
    return null
  }
}

async function getSupabaseOverrideUrl(folder: string, name: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data: list } = await admin.storage.from('legal-forms').list(folder, { search: name, limit: 1 })
    if (!list?.length) return null
    const { data } = admin.storage.from('legal-forms').getPublicUrl(`${folder}/${name}`)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const access = await checkLegalAccess()
  if (!access.allowed) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')
  const type = (searchParams.get('type') ?? 'word') as 'word' | 'excel'
  const doc = searchParams.get('doc') ?? 'tt99'
  if (!file) return new NextResponse('Missing file', { status: 400 })

  const { folder, name, ext } = resolveFormStorage(doc, file, type)

  // 1. Supabase Storage override (admin upload đè)  2. Google Drive qua Apps Script
  const supabaseUrl = await getSupabaseOverrideUrl(folder, name)
  const sourceUrl = supabaseUrl ?? (await getDriveUrl(file, type, doc))

  if (!sourceUrl) return new NextResponse('File not found', { status: 404 })

  const fileRes = await fetch(sourceUrl, { redirect: 'follow' })
  if (!fileRes.ok) return new NextResponse('Upstream error', { status: 502 })

  return new NextResponse(fileRes.body, {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
