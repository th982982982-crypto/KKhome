import { NextResponse } from 'next/server'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { createAdminClient } from '@/lib/supabase/server'

const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY
const WORD_FOLDER_ID = process.env.LEGAL_FORMS_WORD_FOLDER_ID
const EXCEL_FOLDER_ID = process.env.LEGAL_FORMS_EXCEL_FOLDER_ID

async function getDriveFileId(filename: string, folderId: string): Promise<string | null> {
  if (!DRIVE_API_KEY || !folderId) return null
  const q = encodeURIComponent(`name='${filename}' and '${folderId}' in parents and trashed=false`)
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&key=${DRIVE_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function getSupabaseOverrideUrl(filename: string, type: 'word' | 'excel'): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const bucket = 'legal-forms'
    const path = type === 'word' ? `word/${filename}` : `excel/${filename.replace(/\.docx$/, '.xlsx')}`
    const { data } = admin.storage.from(bucket).getPublicUrl(path)
    // Verify the file exists by trying to get its metadata
    const { error } = await admin.storage.from(bucket).list(type === 'word' ? 'word' : 'excel', {
      search: type === 'word' ? filename : filename.replace(/\.docx$/, '.xlsx'),
      limit: 1,
    })
    if (error) return null
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

  const targetFile = type === 'excel' ? file.replace(/\.docx$/, '.xlsx') : file

  // 1. Kiểm tra Supabase Storage trước (admin đã upload override)
  const supabaseUrl = await getSupabaseOverrideUrl(file, type)
  if (supabaseUrl) {
    return NextResponse.redirect(supabaseUrl)
  }

  // 2. Fallback: tìm trên Google Drive
  const folderId = type === 'excel' ? EXCEL_FOLDER_ID : WORD_FOLDER_ID
  if (folderId && DRIVE_API_KEY) {
    const fileId = await getDriveFileId(targetFile, folderId)
    if (fileId) {
      const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
      return NextResponse.redirect(driveUrl)
    }
  }

  return new NextResponse(`File not found: ${targetFile}`, { status: 404 })
}
