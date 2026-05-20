import { createAdminClient } from '@/lib/supabase/server'
import { SiteSettingsEditor } from '@/components/admin/site-settings-editor'
import { Settings } from 'lucide-react'
import type { SiteSettings } from '@/lib/supabase/types'

export const revalidate = 0

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('site_settings').select('*').limit(1).single()
  const settings = data as SiteSettings

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <Settings className="w-4 h-4" />
          <span>Cài đặt</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Cài đặt website</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Thông tin hiển thị ở footer & liên hệ</p>
      </div>
      <SiteSettingsEditor initial={settings} />
    </div>
  )
}
