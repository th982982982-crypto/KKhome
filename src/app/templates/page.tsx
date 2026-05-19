import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TemplateSection } from '@/components/templates/template-section'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const categories = Array.from(new Set(templates?.map((t) => t.category).filter(Boolean) as string[]))

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tất cả Templates</h1>
          <p className="text-gray-500">{templates?.length ?? 0} templates hiện có</p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-4 py-1.5 rounded-full bg-black text-white text-sm font-medium cursor-pointer">
              Tất cả
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {templates && templates.length > 0 ? (
          <TemplateSection templates={templates} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📊</p>
            <p>Chưa có template nào. Vui lòng quay lại sau.</p>
          </div>
        )}
      </div>
    </div>
  )
}
