import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { TemplateExplorer } from '@/components/templates/template-explorer'
import { getUserPurchasedTemplateIds } from '@/lib/access-control'
import { LayoutGrid, Sparkles } from 'lucide-react'

export const revalidate = 0

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let purchasedIds: string[] = []
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
    purchasedIds = await getUserPurchasedTemplateIds(user.id)
  }

  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  const allTemplates = data ?? []

  const categories = Array.from(new Set(allTemplates.map((t) => t.category).filter(Boolean) as string[]))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <main className="flex-1">
      {/* Hero bar */}
      <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 mb-3">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kho templates</span>
                <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-gray-700 font-medium">{allTemplates.length} templates</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
                Tìm template <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">cho doanh nghiệp</span>
              </h1>
              <p className="text-gray-500 mt-2 max-w-xl">
                Templates Google Sheets chuyên nghiệp, có video hướng dẫn, dùng được ngay sau khi mua.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TemplateExplorer
          templates={allTemplates}
          categories={categories}
          purchasedIds={purchasedIds}
        />
      </div>
      </main>

      <SiteFooter />
    </div>
  )
}
