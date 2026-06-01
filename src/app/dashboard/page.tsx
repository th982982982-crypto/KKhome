import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { getUserPurchasedTemplateIds } from '@/lib/access-control'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import type { Template } from '@/lib/supabase/types'
import { Sparkles } from 'lucide-react'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const purchasedTemplateIds = await getUserPurchasedTemplateIds(user.id)

  let accessibleTemplates: Template[] = []
  if (purchasedTemplateIds.length > 0) {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .in('id', purchasedTemplateIds)
      .eq('is_published', true)
    accessibleTemplates = (data ?? []) as Template[]
  }

  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, order_code, total_amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const orders = ordersData ?? []

  const bank = {
    name: process.env.NEXT_PUBLIC_BANK_NAME || 'ACB',
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '4465436',
    owner: process.env.NEXT_PUBLIC_BANK_OWNER || 'HO KINH DOANH KKHOME',
    code: process.env.NEXT_PUBLIC_BANK_CODE || 'ACB',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={profile?.is_admin || !!user.user_metadata?.can_view_legal} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bảng điều khiển cá nhân</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            Xin chào, {profile?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý templates đã mua và đơn hàng của bạn</p>
        </div>

        <DashboardTabs
          accessibleTemplates={accessibleTemplates}
          purchasedIds={purchasedTemplateIds}
          orders={orders}
          bank={bank}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
