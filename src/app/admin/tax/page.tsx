import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'
import { redirect } from 'next/navigation'
import { TaxPlanManager } from '@/components/admin/tax-plan-manager'
import { TaxAccessManager } from '@/components/admin/tax-access-manager'

export const revalidate = 0

export default async function AdminTaxPage() {
  const adminUser = await requireAdmin()
  if (!adminUser) redirect('/login')

  const supabase = createAdminClient()

  const [{ data: plans }, { data: users }, { data: authUsers }, { data: settings }] = await Promise.all([
    supabase.from('tax_plans').select('*').order('sort_order'),
    supabase.from('profiles').select('id, full_name, is_admin, tax_access_until, tax_trial_started_at, tax_trial_count, tax_trial_max_count, tax_trial_bonus_days').order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('site_settings').select('tax_trial_days').single(),
  ])

  const emailMap = Object.fromEntries(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ''])
  )

  const trialDays = settings?.tax_trial_days ?? 14

  const userRows = (users ?? []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] ?? '—',
    full_name: p.full_name,
    is_admin: p.is_admin,
    tax_access_until: p.tax_access_until ?? null,
    tax_trial_started_at: p.tax_trial_started_at ?? null,
    tax_trial_count: p.tax_trial_count ?? 0,
    tax_trial_max_count: p.tax_trial_max_count ?? 1,
    tax_trial_bonus_days: p.tax_trial_bonus_days ?? 0,
  }))

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-50 mb-1">Gói Tờ Khai Thuế</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Quản lý các gói bán quyền truy cập module Tờ Khai Thuế</p>
        <TaxPlanManager initialPlans={plans ?? []} />
      </div>

      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-50 mb-1">Phân Quyền Tờ Khai</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Cấp hoặc thu hồi quyền truy cập Tờ Khai Thuế cho từng user</p>
        <TaxAccessManager users={userRows} trialDays={trialDays} />
      </div>
    </div>
  )
}
