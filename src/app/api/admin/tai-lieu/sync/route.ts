import { NextRequest, NextResponse } from 'next/server'
import { syncAndUpdateAll } from '@/lib/tai-lieu-scanner'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Chỉ tài khoản admin mới có quyền đồng bộ thư mục' }, { status: 403 })
    }

    const result = syncAndUpdateAll()

    return NextResponse.json({
      success: true,
      message: `Đã tự động quét và đồng bộ ${result.count} biểu mẫu thành công!`,
      count: result.count,
      syncStats: result.syncStats,
      items: result.items,
    })
  } catch (err: any) {
    console.error('Lỗi khi đồng bộ biểu mẫu:', err)
    return NextResponse.json({
      error: 'Lỗi khi đồng bộ biểu mẫu: ' + (err?.message || 'Không xác định'),
    }, { status: 500 })
  }
}
