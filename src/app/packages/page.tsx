import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { PackageCard } from '@/components/packages/package-card'
import { LegalPlanCard } from '@/components/legal/legal-plan-card'
import { TaxPlanCard } from '@/components/tax/tax-plan-card'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { Scale, Receipt, Package } from 'lucide-react'
import type { LegalPlan, TaxPlan } from '@/lib/supabase/types'

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
  const taxAccess = hasTaxAccess(profile)
  const admin = createAdminClient()

  const [{ data: packages }, { data: legalPlans }, { data: taxPlans }] = await Promise.all([
    supabase
      .from('packages')
      .select('*, package_templates(template_id, templates(id, name, category))')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('legal_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('duration_months', { ascending: true }),
    admin
      .from('tax_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  const hasPackages = packages && packages.length > 0
  const hasLegal = legalPlans && legalPlans.length > 0
  const hasTax = taxPlans && taxPlans.length > 0

  // Index của gói "recommended" — ưu tiên gói giữa (index 1) trong list 3 gói
  function recommendedIdx(len: number) {
    if (len === 1) return 0
    if (len === 2) return 1
    return 1 // giữa trong 3+
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={legalAccess} canViewTax={hasTaxAccess(profile)} />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900/40 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 mb-3 tracking-tight">
              Nâng cấp quyền truy cập
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-6">
              Mua gói để mở thêm tính năng — mỗi sản phẩm hoạt động độc lập, mua gì dùng nấy.
            </p>
            {/* Quick-jump pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {hasLegal && (
                <a href="#legal" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors">
                  <Scale className="w-3.5 h-3.5" /> Pháp luật
                </a>
              )}
              {hasTax && (
                <a href="#tax" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors">
                  <Receipt className="w-3.5 h-3.5" /> Tờ Khai Thuế
                </a>
              )}
              {hasPackages && (
                <a href="#bundles" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  <Package className="w-3.5 h-3.5" /> Gói Bundle
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Pháp luật */}
        {hasLegal && (
          <section id="legal" className="py-16 bg-indigo-50/60 dark:bg-indigo-950/20">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">Gói Tra cứu Pháp luật</h2>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {legalAccess ? '✓ Bạn đang sử dụng gói này' : 'Thư viện văn bản thuế & kế toán theo thời hạn'}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 ml-13">
                Tra cứu toàn bộ thông tư, nghị định, văn bản pháp luật. Tham chiếu chéo giữa các điều khoản. Tải biểu mẫu đính kèm. Mua thêm để cộng dồn thời gian.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {(legalPlans as LegalPlan[]).map((plan, idx) => (
                  <LegalPlanCard
                    key={plan.id}
                    plan={plan}
                    hasAccess={legalAccess}
                    isRecommended={idx === recommendedIdx(legalPlans!.length)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Tờ khai */}
        {hasTax && (
          <section id="tax" className="py-16 bg-amber-50/60 dark:bg-amber-950/20">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">Gói Tờ Khai Thuế</h2>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    {taxAccess ? '✓ Bạn đang sử dụng gói này' : 'Phân tích XML GTGT, TNDN, TNCN'}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 ml-13">
                Upload XML tờ khai, xem bảng chỉ tiêu theo kỳ/năm, đối soát rủi ro số dư và doanh thu, xuất Excel báo cáo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {(taxPlans as TaxPlan[]).map((plan, idx) => (
                  <TaxPlanCard
                    key={plan.id}
                    plan={plan}
                    hasAccess={taxAccess}
                    isRecommended={idx === recommendedIdx(taxPlans!.length)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Bundles — chỉ hiện khi có */}
        {hasPackages && (
          <section id="bundles" className="py-16 bg-white dark:bg-gray-900/40">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gray-800 dark:bg-gray-200 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-white dark:text-gray-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-50">Gói Template Bundle</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bộ nhiều template, tiết kiệm hơn mua lẻ</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 ml-13">
                Mua cả bộ để tiết kiệm hơn so với mua từng template riêng lẻ.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages!.map((pkg) => (
                  <PackageCard key={pkg.id} package={pkg} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Nếu không có gì */}
        {!hasLegal && !hasTax && !hasPackages && (
          <div className="text-center py-32 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p>Chưa có gói nào. Vui lòng quay lại sau.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
