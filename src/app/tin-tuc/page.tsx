import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { NewsExplorer } from '@/components/news/news-explorer'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import type { NewsPost } from '@/lib/supabase/types'

export const revalidate = 0

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type = 'all' } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data } = await admin
    .from('news_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as NewsPost[]

  return (
    <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={hasLegalAccess(profile)} canViewTax={hasTaxAccess(profile)}>
      <main className="flex-1">
        <section className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Blog KKhome</div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Tin tức & Ưu đãi</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
              Cập nhật tin tức, hướng dẫn và chương trình khuyến mãi mới nhất từ KKhome.
            </p>
          </div>

          <NewsExplorer posts={posts} initialType={type} />
        </section>
      </main>

      <SiteFooter />
    </Navbar>
  )
}
