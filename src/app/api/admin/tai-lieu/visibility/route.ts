import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  readMetadataOverridesAsync,
  writeMetadataOverridesAsync,
  scanTaiLieuDirectoryAsync,
  isTaiLieuPublicAsync,
  setTaiLieuPublicAsync,
} from '@/lib/tai-lieu-scanner'

export const dynamic = 'force-dynamic'

// GET /api/admin/tai-lieu/visibility
export async function GET() {
  try {
    const isPublic = await isTaiLieuPublicAsync(true)
    const metadata = await readMetadataOverridesAsync(true)
    return NextResponse.json({
      isPublicKho: isPublic,
      metadata,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi hệ thống' }, { status: 500 })
  }
}

// POST /api/admin/tai-lieu/visibility
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

    const isAdmin = Boolean(profile?.is_admin || (user.email ? user.email.toLowerCase().includes('admin') : false))

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền đổi trạng thái hiển thị' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, isHidden, isPublicKho } = body

    // 1. Toggle global kho public access
    if (isPublicKho !== undefined) {
      await setTaiLieuPublicAsync(Boolean(isPublicKho))
      return NextResponse.json({
        success: true,
        isPublicKho: Boolean(isPublicKho),
        message: Boolean(isPublicKho)
          ? 'Kho biểu mẫu đã mở hiển thị công khai cho mọi người xem!'
          : 'Kho biểu mẫu đã tạm ẩn, hiện chỉ Admin mới có thể truy cập!',
      })
    }

    // 2. Toggle single template visibility
    if (!id) {
      return NextResponse.json({ error: 'Vui lòng cung cấp mã tài liệu (id)' }, { status: 400 })
    }

    const allMetadata = await readMetadataOverridesAsync(true)
    const existing = allMetadata[id] || {}

    const newHiddenState = isHidden !== undefined ? Boolean(isHidden) : !Boolean(existing.isHidden)

    allMetadata[id] = {
      ...existing,
      isHidden: newHiddenState,
    }

    const updatedItems = await scanTaiLieuDirectoryAsync(true)
    const updatedItem = updatedItems.find((it) => it.id === id) || updatedItems.find((it) => it.filename === id)
    if (updatedItem?.filename && updatedItem.filename !== id) {
      allMetadata[updatedItem.filename] = {
        ...(allMetadata[updatedItem.filename] || {}),
        isHidden: newHiddenState,
      }
    }

    await writeMetadataOverridesAsync(allMetadata)

    return NextResponse.json({
      success: true,
      id,
      isHidden: newHiddenState,
      item: updatedItem,
      message: newHiddenState
        ? `Đã chuyển biểu mẫu "${updatedItem?.title || id}" sang trạng thái: Không hiển thị (Tạm ẩn với người khác)`
        : `Đã chuyển biểu mẫu "${updatedItem?.title || id}" sang trạng thái: Hiển thị (Công khai cho người khác xem)`,
    })
  } catch (err: any) {
    console.error('Lỗi khi đổi trạng thái hiển thị tài liệu:', err)
    return NextResponse.json({ error: err?.message || 'Lỗi server' }, { status: 500 })
  }
}
