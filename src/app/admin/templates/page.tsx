import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/admin/template-editor'
import { LegalPlanManager } from '@/components/admin/legal-plan-manager'
import { TaxPlanManager } from '@/components/admin/tax-plan-manager'
import { TaxTrialConfig } from '@/components/admin/tax-trial-config'
import { AccessManager } from '@/components/admin/access-manager'
import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet, LayoutGrid, ScrollText, Receipt, Users } from 'lucide-react'
import type { LegalPlan, TaxPlan } from '@/lib/supabase/types'

export const revalidate = 0

const TABS = [
  { key: 'templates',   label: 'Templates',      icon: LayoutGrid },
  { key: 'legal-plans', label: 'Gói Pháp luật',  icon: ScrollText },
  { key: 'tax-plans',   label: 'Gói Tờ Khai',    icon: Receipt },
  { key: 'access',      label: 'Phân quyền',      icon: Users },
]

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'templates' } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()

  const [
    { data: templates },
    { data: legalPlans },
    { data: taxPlans },
    { data: profiles },
    { data: settings },
  ] = await Promise.all([
    supabase.from('templates').select('*').order('sort_order', { ascending: true }),
    admin.from('legal_plans').select('*').order('sort_order', { ascending: true }),
    admin.from('tax_plans').select('*').order('sort_order', { ascending: true }),
    admin.from('profiles').select('id, full_name, is_admin, legal_access_until, tax_access_until').order('created_at'),
    admin.from('site_settings').select('tax_trial_days').single(),
  ])

  // Fetch emails from auth.users via admin client
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email ?? '']))

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailMap[p.id] ?? '',
    full_name: p.full_name,
    is_admin: p.is_admin,
    legal_access_until: p.legal_access_until,
    tax_access_until: p.tax_access_until,
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Templates</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Quản lý Sản phẩm & Quyền</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Templates · Gói Pháp luật · Gói Tờ Khai · Phân quyền người dùng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === key
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {tab === 'templates' && <TemplateEditor initialTemplates={templates ?? []} />}

      {tab === 'legal-plans' && (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Gói truy cập thư viện Pháp luật theo thời hạn. Khách mua qua giỏ hàng; admin duyệt đơn sẽ tự cộng thời hạn.
          </p>
          <LegalPlanManager initialPlans={(legalPlans as LegalPlan[]) ?? []} />
        </>
      )}

      {tab === 'tax-plans' && (
        <>
          <TaxTrialConfig initialDays={settings?.tax_trial_days ?? 14} />
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
            Gói Tờ Khai Thuế theo thời hạn. Nhập <strong>0 tháng</strong> = gói trọn đời (vĩnh viễn).
          </p>
          <TaxPlanManager initialPlans={(taxPlans as TaxPlan[]) ?? []} />
        </>
      )}

      {tab === 'access' && (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Quản lý quyền truy cập Pháp luật và Tờ Khai cho từng người dùng.
          </p>
          <AccessManager users={users} />
        </>
      )}
    </div>
  )
}
