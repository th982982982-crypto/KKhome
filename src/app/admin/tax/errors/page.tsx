import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/require-admin'
import { redirect } from 'next/navigation'
import { TaxUploadErrorsTable } from '@/components/admin/tax-upload-errors-table'
import { AlertTriangle } from 'lucide-react'

export const revalidate = 0

export default async function AdminTaxErrorsPage() {
  const adminUser = await requireAdmin()
  if (!adminUser) redirect('/login')

  const supabase = createAdminClient()

  const [{ data: errors }, { data: authUsers }, { data: profiles }] = await Promise.all([
    supabase.from('tax_upload_errors').select('*').order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('profiles').select('id, full_name'),
  ])

  const emailMap = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email ?? '']))
  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

  const rows = (errors ?? []).map((e) => ({
    ...e,
    user_email: emailMap[e.user_id] ?? '—',
    user_name: nameMap[e.user_id] ?? null,
  }))

  const pending = rows.filter((r) => r.status === 'pending').length

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>Tờ Khai Thuế</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">File tải lên bị lỗi</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{rows.length}</span> file •{' '}
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{pending}</span> chờ xử lý
        </p>
      </div>

      <TaxUploadErrorsTable errors={rows} />
    </div>
  )
}
