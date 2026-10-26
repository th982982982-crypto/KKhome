import { NextRequest, NextResponse } from 'next/server'
import { scanTaiLieuDirectoryAsync, syncTaiLieuDirectories, isTaiLieuPublicAsync } from '@/lib/tai-lieu-scanner'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('q')?.toLowerCase().trim()
    const refresh = searchParams.get('refresh') === '1'
    const visibility = searchParams.get('visibility')

    let isAdmin = false
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        isAdmin = Boolean(profile?.is_admin || (user.email ? user.email.toLowerCase().includes('admin') : false))
        if (isAdmin && refresh) {
          syncTaiLieuDirectories()
        }
      }
    } catch {}

    const isPublic = await isTaiLieuPublicAsync(true)

    // 1. Khi kho Tạm ẩn: sẽ ẩn toàn bộ với người dùng thông thường
    if (!isPublic && !isAdmin) {
      return NextResponse.json({
        success: true,
        count: 0,
        isPublicKho: false,
        message: 'Kho tài liệu đang tạm ẩn',
        stats: { total: 0, nhanSu: 0, hopDong: 0, kpi: 0, keToan: 0, thue: 0, bhxh: 0 },
        items: [],
      })
    }

    let items = await scanTaiLieuDirectoryAsync(refresh)

    // 2. Khi kho Công khai: chỉ hiển thị những mẫu hiển thị, mẫu bị ẩn không hiển thị
    if (!isAdmin) {
      items = items.filter((item) => !item.isHidden)
    } else {
      if (visibility === 'visible') {
        items = items.filter((item) => !item.isHidden)
      } else if (visibility === 'hidden') {
        items = items.filter((item) => item.isHidden)
      }
    }

    if (category && category !== 'all') {
      items = items.filter((item) => item.category === category)
    }

    if (query) {
      items = items.filter((item) => 
        item.title.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.filename.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    const stats = {
      total: items.length,
      nhanSu: items.filter((i) => i.category === 'nhan_su').length,
      hopDong: items.filter((i) => i.category === 'hop_dong').length,
      kpi: items.filter((i) => i.category === 'kpi').length,
      keToan: items.filter((i) => i.category === 'ke_toan').length,
      thue: items.filter((i) => i.category === 'thue').length,
      bhxh: items.filter((i) => i.category === 'bhxh').length,
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      isPublicKho: isPublic,
      stats,
      items,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Lỗi khi tải danh sách biểu mẫu',
    }, { status: 500 })
  }
}
