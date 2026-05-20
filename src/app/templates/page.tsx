import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TemplateSection } from '@/components/templates/template-section'

export const revalidate = 0

export default async function TemplatesPage(props: {
  searchParams: Promise<{ category?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedCategory = searchParams.category || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: allTemplates = [] } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  const categories = Array.from(new Set(allTemplates.map((t) => t.category).filter(Boolean) as string[]))
  const templates = selectedCategory
    ? allTemplates.filter((t) => t.category === selectedCategory)
    : allTemplates

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tất cả Templates</h1>
          <p className="text-gray-500">{templates.length} templates hiện có</p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/templates"
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/templates?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {templates.length > 0 ? (
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
