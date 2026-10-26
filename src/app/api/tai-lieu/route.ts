import { NextRequest, NextResponse } from 'next/server'
import { scanTaiLieuDirectory, syncTaiLieuDirectories } from '@/lib/tai-lieu-scanner'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const query = searchParams.get('q')?.toLowerCase().trim()
    const refresh = searchParams.get('refresh') === '1'

    // If refresh requested, check if user is admin or allow lightweight directory sync
    if (refresh) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
          if (profile?.is_admin) {
            syncTaiLieuDirectories()
          }
        }
      } catch {}
    }

    let items = scanTaiLieuDirectory()

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
