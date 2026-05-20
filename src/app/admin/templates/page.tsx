import { createClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/admin/template-editor'
import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'

export default async function AdminTemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Templates</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Nhập và chỉnh sửa trực tiếp trên bảng</p>
        </div>
      </div>

      <TemplateEditor initialTemplates={templates ?? []} />
    </div>
  )
}
