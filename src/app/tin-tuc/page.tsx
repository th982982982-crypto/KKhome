import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { PostCard } from '@/components/news/post-card'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import type { NewsPost } from '@/lib/supabase/types'

export const revalidate = 0

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tin_tuc', label: 'Tin tức' },
  { key: 'quang_cao', label: 'Quảng cáo' },
]

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
  const filtered = type === 'all' ? posts : posts.filter((p) => p.post_type === type)
  const [hero, ...rest] = filtered

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={hasLegalAccess(profile)} canViewTax={hasTaxAccess(profile)} />

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="mb-8">
            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Blog KKhome</div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Tin tức & Ưu đãi</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
              Cập nhật tin tức, hướng dẫn và chương trình khuyến mãi mới nhất từ KKhome.
            </p>
          </div>

          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.key === 'all' ? '/tin-tuc' : `/tin-tuc?type=${t.key}`}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  type === t.key
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-20">Chưa có bài viết nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hero && <PostCard post={hero} featured />}
              {rest.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
