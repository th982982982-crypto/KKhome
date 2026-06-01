import { createAdminClient } from '@/lib/supabase/server'
import { LegalAccessManager } from '@/components/admin/legal-access-manager'
import { Scale } from 'lucide-react'

export const revalidate = 0

export default async function AdminLegalPage() {
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
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <Scale className="w-4 h-4" />
          <span>Văn bản pháp luật</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          Phân quyền Tra cứu Pháp luật
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Cấp hoặc thu hồi quyền xem văn bản pháp luật cho từng người dùng
        </p>
      </div>

      <LegalAccessManager users={users} />
    </div>
  )
}
