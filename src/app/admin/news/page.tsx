import { createAdminClient } from '@/lib/supabase/server'
import { NewsManager } from '@/components/admin/news-manager'

export const revalidate = 0

export default async function AdminNewsPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from('news_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Tin tức & Quảng cáo</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Viết và quản lý bài viết hiển thị tại /tin-tuc</p>
      </div>

      <NewsManager initialPosts={posts ?? []} />
    </div>
  )
}
