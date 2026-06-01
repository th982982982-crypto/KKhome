import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { checkLegalAccess } from '@/lib/legal/check-legal-access'
import { getDocBySlug } from '@/lib/legal/registry'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const access = await checkLegalAccess()
  if (!access.allowed) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { slug } = await params
  const doc = getDocBySlug(slug)
  if (!doc) return new NextResponse('Not Found', { status: 404 })

  const html = await readFile(doc.filePath, 'utf-8')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  })
}
