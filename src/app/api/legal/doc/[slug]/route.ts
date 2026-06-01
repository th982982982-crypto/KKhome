import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'

const BASE = '/Users/trieuhoang/Documents/Projects/Support Chị Ngân/'

const DOC_PATHS: Record<string, { path: string; filename: string; mime: string }> = {
  'tt58': {
    path: BASE + 'Thông-tư-58-2026-TT-BTC/Thông-tư-58-2026-TT-BTC.docx',
    filename: 'Thông-tư-58-2026-TT-BTC.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  'tt133': {
    path: BASE + 'Thông-tư-133-2016-TT-BTC/Thông-tư-133-2016-TT-BTC.doc',
    filename: 'Thông-tư-133-2016-TT-BTC.doc',
    mime: 'application/msword',
  },
  'tt152': {
    path: BASE + 'Thông-tư-152-2025-TT-BTC/Thông-tư-152-2025-TT-BTC.docx',
    filename: 'Thông-tư-152-2025-TT-BTC.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const access = await checkLegalAccess()
  if (!access.allowed) return new NextResponse('Unauthorized', { status: 401 })

  const { slug } = await params
  const doc = DOC_PATHS[slug]
  if (!doc) return new NextResponse('Not Found', { status: 404 })

  const bytes = await readFile(doc.path)
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': doc.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
