import { NextResponse } from 'next/server'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { createAdminClient } from '@/lib/supabase/server'

const LEGAL_SCRIPT_URL = process.env.LEGAL_FORMS_SCRIPT_URL

const MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

// doc='tt99' (mặc định) dùng folder gốc; các thông tư khác truyền doc=tt133|tt58|tt152
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

async function getSupabaseOverrideUrl(targetFile: string, type: 'word' | 'excel', doc: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    // TT99 giữ folder gốc word/excel; thông tư khác namespace theo doc
    const sub = type === 'word' ? 'word' : 'excel'
    const folder = doc === 'tt99' ? sub : `${doc}/${sub}`
    const { data: list } = await admin.storage.from('legal-forms').list(folder, {
      search: targetFile, limit: 1,
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
  const doc = searchParams.get('doc') ?? 'tt99'
  if (!file) return new NextResponse('Missing file', { status: 400 })

  const ext = type === 'excel' ? 'xlsx' : 'docx'
  // Nếu file đã có đuôi (.docx của TT99) thì đổi sang .xlsx khi cần; nếu là mã (S1-DNSN) thì gắn đuôi
  let downloadName: string
  if (/\.(docx|xlsx)$/i.test(file)) {
    downloadName = type === 'excel' ? file.replace(/\.docx$/i, '.xlsx') : file
  } else {
    downloadName = `${file}.${ext}`
  }

  // 1. Supabase Storage override (admin upload đè)
  const supabaseUrl = await getSupabaseOverrideUrl(downloadName, type, doc)
  // 2. Google Drive qua Apps Script
  const sourceUrl = supabaseUrl ?? await getDriveUrl(file, type, doc)

  if (!sourceUrl) return new NextResponse('File not found', { status: 404 })

  // Proxy file qua server — tránh CORS/sandbox của browser
  const fileRes = await fetch(sourceUrl, { redirect: 'follow' })
  if (!fileRes.ok) return new NextResponse('Upstream error', { status: 502 })

  return new NextResponse(fileRes.body, {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
