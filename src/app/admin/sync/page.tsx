import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SyncSheets } from '@/components/admin/sync-sheets'

export default async function AdminSyncPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={true} />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đồng bộ Google Sheets</h1>
        <p className="text-gray-500 mb-8">
          Hệ thống tự động đọc cột từ Google Sheet, khớp tên cột và đồng bộ vào database.
        </p>
        <SyncSheets />
      </div>
    </div>
  )
}
