import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { TaiLieuExplorer } from '@/components/tai-lieu/tai-lieu-explorer'
import { scanTaiLieuDirectory, isTaiLieuPublic } from '@/lib/tai-lieu-scanner'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'

export const revalidate = 0

export const metadata = {
  title: 'Kho Tài Liệu & Biểu Mẫu 2026 — KKhome',
  description: 'Hệ thống biểu mẫu chuẩn hóa dành cho Nhân sự, Kế toán, Thuế và Bảo hiểm Xã hội — KK HOME',
}

export default async function TaiLieuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const isAdmin = Boolean(profile?.is_admin)
  const isPublic = isTaiLieuPublic()

  // Nếu kho tài liệu đang tạm ẩn và không phải Admin thì chuyển hướng về trang chủ
  if (!isPublic && !isAdmin) {
    redirect('/')
  }

  // Tự động quét và lấy danh sách biểu mẫu trực tiếp từ thư mục
  const allItems = scanTaiLieuDirectory()

  // Với người dùng thông thường, chỉ hiển thị các biểu mẫu không bị ẩn (isHidden !== true)
  const initialItems = isAdmin ? allItems : allItems.filter((item) => !item.isHidden)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 dark:bg-gray-950">
      <Navbar 
        user={user} 
        isAdmin={isAdmin} 
        canViewLegal={hasLegalAccess(profile)} 
        canViewTax={hasTaxAccess(profile)} 
        isTaiLieuPublic={isPublic}
      />

      <main className="flex-1">
        <TaiLieuExplorer 
          user={user} 
          isAdmin={isAdmin} 
          initialItems={initialItems} 
          isPublicKho={isPublic}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
