import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { TAI_LIEU_ITEMS } from '@/lib/tai-lieu-data'
import { scanTaiLieuDirectoryAsync, isTaiLieuPublicAsync } from '@/lib/tai-lieu-scanner'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Thiếu mã tài liệu' }, { status: 400 })
  }

  // Check admin
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      isAdmin = Boolean(profile?.is_admin || (user.email ? user.email.toLowerCase().includes('admin') : false))
    }
  } catch {}

  const isPublic = await isTaiLieuPublicAsync()
  if (!isPublic && !isAdmin) {
    return NextResponse.json({ error: 'Kho tài liệu đang tạm ẩn' }, { status: 403 })
  }

  const liveItems = await scanTaiLieuDirectoryAsync()
  let item = liveItems.find((t) => t.id === id) || TAI_LIEU_ITEMS.find((t) => t.id === id)

  if (!item) {
    return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
  }

  if (item.isHidden && !isAdmin) {
    return NextResponse.json({ error: 'Biểu mẫu này đang ở trạng thái tạm ẩn' }, { status: 403 })
  }

  // Ensure path is safe (prevent path traversal)
  const safeRelativePath = item.downloadUrl.replace(/^\/+/, '')
  const filePath = path.join(process.cwd(), 'public', safeRelativePath)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Tệp không tồn tại trên hệ thống' }, { status: 404 })
  }

  try {
    const pdfRelativePath = safeRelativePath.replace(/\.(docx|xlsx)$/i, '.pdf')
    const pdfFilePath = path.join(process.cwd(), 'public', pdfRelativePath)
    const hasPdf = fs.existsSync(pdfFilePath)
    const pdfUrl = hasPdf 
      ? '/' + pdfRelativePath.replace(/\\/g, '/')
      : (item.fileType === 'pdf' ? item.downloadUrl : undefined)

    if (item.fileType === 'pdf') {
      return NextResponse.json({
        fileType: 'pdf',
        title: item.title,
        url: item.downloadUrl,
        pdfUrl: item.downloadUrl,
      })
    }

    if (item.fileType === 'docx') {
      const buffer = fs.readFileSync(filePath)
      const result = await mammoth.convertToHtml({ buffer })
      return NextResponse.json({
        fileType: 'docx',
        title: item.title,
        url: pdfUrl,
        pdfUrl: pdfUrl,
        html: result.value,
      })
    }

    if (item.fileType === 'xlsx') {
      const buffer = fs.readFileSync(filePath)
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const sheets = wb.SheetNames.map((name) => {
        const sheet = wb.Sheets[name]
        const rawRows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
        }) as any[][]

        // Limit preview to first 100 rows to keep response snappy
        const previewRows = rawRows.slice(0, 100)
        let maxCols = 0
        previewRows.forEach((r) => {
          if (Array.isArray(r) && r.length > maxCols) maxCols = r.length
        })

        return {
          name,
          totalRows: rawRows.length,
          maxCols: Math.min(maxCols, 30),
          rows: previewRows,
        }
      })

      return NextResponse.json({
        fileType: 'xlsx',
        title: item.title,
        url: pdfUrl,
        pdfUrl: pdfUrl,
        sheets,
      })
    }

    return NextResponse.json({ error: 'Định dạng không được hỗ trợ' }, { status: 400 })
  } catch (err: any) {
    console.error('Error generating preview:', err)
    return NextResponse.json({ error: 'Không thể tạo bản xem trước: ' + (err?.message || 'Lỗi xử lý') }, { status: 500 })
  }
}
