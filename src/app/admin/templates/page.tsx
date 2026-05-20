import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TemplateEditor } from '@/components/admin/template-editor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={true} />

      <div className="max-w-full mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Templates</h1>
            <p className="text-sm text-gray-500 mt-0.5">Nhập và chỉnh sửa trực tiếp trên bảng</p>
          </div>
        </div>

        <TemplateEditor initialTemplates={templates ?? []} />
      </div>
    </div>
  )
}
