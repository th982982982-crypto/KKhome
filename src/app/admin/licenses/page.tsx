import { createAdminClient } from '@/lib/supabase/server'
import { LicensesTable } from '@/components/admin/licenses-table'

export const revalidate = 0

export default async function LicensesPage() {
  const supabase = createAdminClient()

  const { data: licenses } = await supabase
    .from('licenses')
    .select('*, templates(name, google_sheet_copy_url)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50">Licenses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý license key của khách hàng</p>
      </div>
      <LicensesTable licenses={licenses ?? []} />
    </div>
  )
}
