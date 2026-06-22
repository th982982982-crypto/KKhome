import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { PackageCard } from '@/components/packages/package-card'
import { LegalPlanCard } from '@/components/legal/legal-plan-card'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import type { LegalPlan } from '@/lib/supabase/types'

export const revalidate = 0

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const legalAccess = hasLegalAccess(profile)

  const [{ data: packages }, { data: legalPlans }] = await Promise.all([
    supabase
      .from('packages')
      .select('*, package_templates(template_id, templates(id, name, category))')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    createAdminClient()
      .from('legal_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('duration_months', { ascending: true }),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={legalAccess} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-3">Chọn gói phù hợp</h1>
          <p className="text-gray-500 dark:text-gray-400">Mua theo gói để tiết kiệm hơn và truy cập nhiều templates hơn</p>
        </div>

        {packages && packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p>Chưa có gói nào. Vui lòng quay lại sau.</p>
          </div>
        )}

        {legalPlans && legalPlans.length > 0 && (
          <section className="mt-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Gói Tra cứu Pháp luật</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Mở quyền truy cập thư viện văn bản thuế &amp; kế toán theo thời hạn. Mua thêm để cộng dồn thời gian.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {(legalPlans as LegalPlan[]).map((plan) => (
                <LegalPlanCard key={plan.id} plan={plan} hasAccess={legalAccess} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
