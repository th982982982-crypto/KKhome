import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  readMetadataOverrides,
  writeMetadataOverrides,
  scanTaiLieuDirectory,
  writeTaiLieuDataFile,
  type TaiLieuMetadataOverride,
} from '@/lib/tai-lieu-scanner'

export const dynamic = 'force-dynamic'

const CATEGORY_MAP: Record<string, string> = {
  nhan_su: 'Nhân sự',
  ke_toan: 'Kế toán',
  thue: 'Pháp lý doanh nghiệp',
  bhxh: 'Bảo hiểm XH',
  kpi: 'KPI',
  hop_dong: 'Hợp đồng',
}

// GET /api/admin/tai-lieu/info or ?id=tl_1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const allMetadata = readMetadataOverrides()

    if (id) {
      return NextResponse.json({ metadata: allMetadata[id] || null })
    }

    return NextResponse.json({ allMetadata })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi hệ thống' }, { status: 500 })
  }
}

// POST /api/admin/tai-lieu/info
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền chỉnh sửa thông tin biểu mẫu' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      id,
      title,
      code,
      description,
      category,
      categoryLabel,
      year,
      tags,
      featured,
      isHot,
      highlights,
      isHidden,
      googleSheetUrl,
      googleDocUrl,
      googleDriveUrl,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã định danh tài liệu (id)' }, { status: 400 })
    }

    const allMetadata = readMetadataOverrides()
    const existing = allMetadata[id] || {}

    const catKey = category || existing.category || 'nhan_su'
    const catLabel = categoryLabel || CATEGORY_MAP[catKey] || existing.categoryLabel || 'Nhân sự'

    // Clean tags
    let processedTags: string[] | undefined = undefined
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.map((t: string) => String(t).trim()).filter(Boolean)
      } else if (typeof tags === 'string') {
        processedTags = tags
          .split(',')
          .map((t: string) => t.trim().replace(/^#/, ''))
          .filter(Boolean)
      }
    }

    // Clean highlights
    let processedHighlights: string[] | undefined = undefined
    if (highlights !== undefined) {
      if (Array.isArray(highlights)) {
        processedHighlights = highlights.map((h: string) => String(h).trim()).filter(Boolean)
      } else if (typeof highlights === 'string') {
        processedHighlights = highlights
          .split('\n')
          .map((h: string) => h.trim().replace(/^[-*•]\s*/, ''))
          .filter(Boolean)
      }
    }

    const newOverride: TaiLieuMetadataOverride = {
      ...existing,
      title: title !== undefined ? String(title).trim() : existing.title,
      description: description !== undefined ? String(description).trim() : existing.description,
      code: code !== undefined ? String(code).trim() : existing.code,
      category: catKey,
      categoryLabel: catLabel,
      year: year !== undefined ? Number(year) : (existing.year || 2026),
      tags: processedTags !== undefined ? processedTags : existing.tags,
      featured: featured !== undefined ? Boolean(featured) : existing.featured,
      isHot: isHot !== undefined ? Boolean(isHot) : existing.isHot,
      highlights: processedHighlights !== undefined ? processedHighlights : existing.highlights,
      isHidden: isHidden !== undefined ? Boolean(isHidden) : existing.isHidden,
      googleSheetUrl: googleSheetUrl !== undefined ? String(googleSheetUrl).trim() || undefined : existing.googleSheetUrl,
      googleDocUrl: googleDocUrl !== undefined ? String(googleDocUrl).trim() || undefined : existing.googleDocUrl,
      googleDriveUrl: googleDriveUrl !== undefined ? String(googleDriveUrl).trim() || undefined : existing.googleDriveUrl,
    }

    allMetadata[id] = newOverride
    writeMetadataOverrides(allMetadata)

    // Re-scan and persist to tai-lieu-data.ts
    const updatedItems = scanTaiLieuDirectory()
    writeTaiLieuDataFile(updatedItems)

    const updatedItem = updatedItems.find((it) => it.id === id)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu và cập nhật thông tin & tóm tắt biểu mẫu thành công!',
      item: updatedItem,
      override: newOverride,
    })
  } catch (err: any) {
    console.error('Lỗi khi cập nhật thông tin tài liệu:', err)
    return NextResponse.json({ error: err?.message || 'Lỗi server khi lưu thông tin' }, { status: 500 })
  }
}
