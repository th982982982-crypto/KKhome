import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { TaiLieuExplorer } from '@/components/tai-lieu/tai-lieu-explorer'
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

  // Tạm thời ẩn đối với người dùng thông thường, chỉ hiển thị cho tài khoản admin
  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 dark:bg-gray-950">
      <Navbar 
        user={user} 
        isAdmin={profile?.is_admin} 
        canViewLegal={hasLegalAccess(profile)} 
        canViewTax={hasTaxAccess(profile)} 
      />

      <main className="flex-1">
        <TaiLieuExplorer user={user} isAdmin={profile?.is_admin} />
      </main>

      <SiteFooter />
    </div>
  )
}
