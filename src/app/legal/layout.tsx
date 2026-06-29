import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { LegalPlanCard } from '@/components/legal/legal-plan-card'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { ScrollText, MessageCircle, LogIn } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { LegalPlan } from '@/lib/supabase/types'

export const revalidate = 0

async function getActivePlans(): Promise<LegalPlan[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('legal_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('duration_months', { ascending: true })
  return (data as LegalPlan[]) ?? []
}

function SalesScreen({
  user,
  isAdmin,
  plans,
  loggedIn,
}: {
  user: User | null
  isAdmin: boolean
  plans: LegalPlan[]
  loggedIn: boolean
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar user={user ?? undefined} isAdmin={isAdmin} canViewLegal={false} />
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-6">
              <ScrollText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 mb-3">
              Thư viện Tra cứu Pháp luật
            </h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Tra cứu toàn bộ văn bản thuế &amp; kế toán hiện hành: luật, nghị định, thông tư —
              kèm tham chiếu chéo điều khoản và biểu mẫu tải về. Chọn gói thời hạn phù hợp để mở quyền truy cập.
            </p>
            {!loggedIn && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <LogIn className="w-4 h-4" /> Bạn cần
                <Link href="/login?redirect=/legal" className="underline font-semibold">đăng nhập</Link>
                trước khi mua gói.
              </p>
            )}
          </div>

          {plans.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((p) => (
                <LegalPlanCard key={p.id} plan={p} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10">
              <p>Hiện chưa có gói nào được mở bán. Vui lòng liên hệ hỗ trợ.</p>
            </div>
          )}

          <div className="text-center mt-10">
            <a
              href="https://zalo.me/0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Chưa đăng nhập → màn bán + nhắc đăng nhập
  if (!user) {
    const plans = await getActivePlans()
    return <SalesScreen user={null} isAdmin={false} plans={plans} loggedIn={false} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, legal_access_until, tax_access_until')
    .eq('id', user.id)
    .single()

  // Đã đăng nhập nhưng chưa có quyền (hoặc đã hết hạn) → màn bán
  if (!hasLegalAccess(profile)) {
    const plans = await getActivePlans()
    return <SalesScreen user={user} isAdmin={!!profile?.is_admin} plans={plans} loggedIn />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={true} canViewTax={hasTaxAccess(profile)} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  )
}
