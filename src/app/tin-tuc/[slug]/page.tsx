import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { PostCard } from '@/components/news/post-card'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { ChevronRight } from 'lucide-react'
import type { NewsPost } from '@/lib/supabase/types'

export const revalidate = 0

const TYPE_LABEL: Record<string, string> = { tin_tuc: 'Tin tức', quang_cao: 'Quảng cáo' }

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function estimateReadingMinutes(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()
  const { data } = await admin
    .from('news_posts')
    .select('title, excerpt, cover_image_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return { title: 'Bài viết không tồn tại' }

  return {
    title: `${data.title} | KKhome`,
    description: data.excerpt ?? undefined,
    openGraph: {
      title: data.title,
      description: data.excerpt ?? undefined,
      images: data.cover_image_url ? [data.cover_image_url] : undefined,
    },
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: postData } = await admin
    .from('news_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!postData) notFound()
  const post = postData as NewsPost

  const { data: relatedData } = await admin
    .from('news_posts')
    .select('*')
    .eq('is_published', true)
    .eq('post_type', post.post_type)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const related = (relatedData ?? []) as NewsPost[]
  const readingMinutes = estimateReadingMinutes(post.content)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={hasLegalAccess(profile)} canViewTax={hasTaxAccess(profile)} />

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tin-tuc" className="hover:text-gray-600 dark:hover:text-gray-300">Tin tức</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 dark:text-gray-300 truncate">{post.title}</span>
          </nav>

          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${post.post_type === 'quang_cao' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
            {TYPE_LABEL[post.post_type]}
          </span>
          {post.category && (
            <span className="ml-2 inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{post.category}</span>
          )}

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight leading-tight mt-3 mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-8">
            {post.author_name && <span className="font-medium text-gray-700 dark:text-gray-300">{post.author_name}</span>}
            {post.author_name && <span>·</span>}
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span>{readingMinutes} phút đọc</span>
          </div>

          {post.cover_image_url && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 mb-10">
              <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
            </div>
          )}

          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-5">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
