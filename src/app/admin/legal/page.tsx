import { createAdminClient } from '@/lib/supabase/server'
import { LegalAccessManager } from '@/components/admin/legal-access-manager'
import { FormsManager } from '@/components/admin/legal-forms/forms-manager'
import { Scale, Users, FileDown } from 'lucide-react'

export const revalidate = 0

export default async function AdminLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'access' } = await searchParams
  const admin = createAdminClient()

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    admin.from('profiles').select('id, full_name, is_admin'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const users = (authData?.users ?? []).map((u) => {
    const profile = profiles?.find((p) => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: profile?.full_name ?? null,
      is_admin: profile?.is_admin ?? false,
      can_view_legal: !!(u.user_metadata?.can_view_legal),
    }
  })

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <Scale className="w-4 h-4" />
          <span>Văn bản pháp luật</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          Quản lý Pháp luật
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {[
          { key: 'access', label: 'Phân quyền', icon: Users },
          { key: 'forms', label: 'Biểu mẫu', icon: FileDown },
        ].map(({ key, label, icon: Icon }) => (
          <a
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
          </a>
        ))}
      </div>

      {tab === 'access' && (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Cấp hoặc thu hồi quyền xem văn bản pháp luật cho từng người dùng
          </p>
          <LegalAccessManager users={users} />
        </>
      )}

      {tab === 'forms' && (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Quản lý biểu mẫu của tất cả văn bản — chọn văn bản rồi upload phiên bản mới (sẽ ghi đè link tải của người dùng)
          </p>
          <FormsManager />
        </>
      )}
    </div>
  )
}
