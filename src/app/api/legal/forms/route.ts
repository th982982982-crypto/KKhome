import { NextResponse } from 'next/server'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { createAdminClient } from '@/lib/supabase/server'

const LEGAL_SCRIPT_URL = process.env.LEGAL_FORMS_SCRIPT_URL

async function getDriveUrl(filename: string, type: 'word' | 'excel'): Promise<string | null> {
  if (!LEGAL_SCRIPT_URL) return null
  const url = `${LEGAL_SCRIPT_URL}?action=get_form_url&file=${encodeURIComponent(filename)}&type=${type}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  } catch {
    return null
  }
}

async function getSupabaseOverrideUrl(filename: string, type: 'word' | 'excel'): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const folder = type === 'word' ? 'word' : 'excel'
    const targetFile = type === 'excel' ? filename.replace(/\.docx$/, '.xlsx') : filename
    const { data: list } = await admin.storage.from('legal-forms').list(folder, {
      search: targetFile,
      limit: 1,
    })
    if (!list?.length) return null
    const { data } = admin.storage.from('legal-forms').getPublicUrl(`${folder}/${targetFile}`)
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

  if (!file) return new NextResponse('Missing file param', { status: 400 })

  // 1. Supabase Storage override (admin đã upload phiên bản mới)
  const supabaseUrl = await getSupabaseOverrideUrl(file, type)
  if (supabaseUrl) return NextResponse.redirect(supabaseUrl)

  // 2. Google Drive qua Apps Script
  const driveUrl = await getDriveUrl(file, type)
  if (driveUrl) return NextResponse.redirect(driveUrl)

  return new NextResponse('File not found', { status: 404 })
}
