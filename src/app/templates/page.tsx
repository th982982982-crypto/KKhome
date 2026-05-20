import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TemplateSection } from '@/components/templates/template-section'
import { LayoutGrid } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      {/* Hero bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <LayoutGrid className="w-4 h-4" />
                <span>Kho templates</span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tất cả Templates</h1>
              <p className="text-gray-500 mt-1">
                <span className="font-semibold text-gray-900">{templates.length}</span> templates chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              <Link
                href="/templates"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95
                  ${!selectedCategory
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Tất cả ({allTemplates.length})
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/templates?category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95
                    ${selectedCategory === cat
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {cat} ({allTemplates.filter(t => t.category === cat).length})
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {templates.length > 0 ? (
          <TemplateSection templates={templates} />
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-7 h-7 text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">Chưa có template nào trong danh mục này</p>
            <Link href="/templates" className="text-sm text-gray-400 hover:text-gray-600 mt-2 inline-block underline">
              Xem tất cả
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
