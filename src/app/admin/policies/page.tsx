import { createAdminClient } from '@/lib/supabase/server'
import { PoliciesEditor } from '@/components/admin/policies-editor'
import { FileText } from 'lucide-react'
import type { Policy } from '@/lib/supabase/types'

export const revalidate = 0

export default async function AdminPoliciesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('policies')
    .select('*')
    .order('slug')

  const policies = (data ?? []) as Policy[]

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <FileText className="w-4 h-4" />
          <span>Chính sách</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Chính sách website</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý nội dung các trang chính sách hiển thị ở footer</p>
      </div>
      <PoliciesEditor policies={policies} />
    </div>
  )
}
