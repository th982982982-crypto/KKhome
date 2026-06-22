import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/admin/template-editor'
import { LegalPlanManager } from '@/components/admin/legal-plan-manager'
import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet, LayoutGrid, ScrollText } from 'lucide-react'
import type { LegalPlan } from '@/lib/supabase/types'

export const revalidate = 0

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'templates' } = await searchParams
  const supabase = await createClient()

  const [{ data: templates }, { data: plans }] = await Promise.all([
    supabase.from('templates').select('*').order('sort_order', { ascending: true }),
    createAdminClient().from('legal_plans').select('*').order('sort_order', { ascending: true }),
  ])

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Templates</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Quản lý Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nhập và chỉnh sửa trực tiếp trên bảng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {[
          { key: 'templates', label: 'Templates', icon: LayoutGrid },
          { key: 'legal-plans', label: 'Gói Pháp luật', icon: ScrollText },
        ].map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
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
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Bán quyền truy cập thư viện Pháp luật như một sản phẩm theo thời hạn (1/3/6/12 tháng). Khách mua qua giỏ hàng; admin duyệt đơn sẽ tự cộng thời hạn cho tài khoản.
          </p>
          <LegalPlanManager initialPlans={(plans as LegalPlan[]) ?? []} />
        </>
      )}
    </div>
  )
}
