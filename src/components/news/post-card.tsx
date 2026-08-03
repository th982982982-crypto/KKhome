import Link from 'next/link'
import Image from 'next/image'
import type { NewsPost } from '@/lib/supabase/types'

const TYPE_LABEL: Record<string, string> = { tin_tuc: 'Tin tức', quang_cao: 'Quảng cáo' }

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PostCard({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  return (
    <Link
      href={`/tin-tuc/${post.slug}`}
      className={`group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/40 hover:shadow-xl dark:hover:shadow-black/60 hover:-translate-y-1 transition-all duration-300 ${featured ? 'sm:col-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden bg-gray-50 dark:bg-gray-800 ${featured ? 'aspect-[21/9]' : 'aspect-[16/10]'}`}>
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes={featured ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <span className="text-gray-300 dark:text-gray-600 text-5xl">📰</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${post.post_type === 'quang_cao' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
            {TYPE_LABEL[post.post_type]}
          </span>
        </div>
      </div>
      <div className={featured ? 'p-5 sm:p-6' : 'p-4'}>
        {post.category && (
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{post.category}</span>
        )}
        <h3 className={`font-bold text-gray-900 dark:text-gray-50 leading-snug mt-1 mb-1.5 group-hover:text-black dark:group-hover:text-white ${featured ? 'text-xl sm:text-2xl line-clamp-2' : 'text-sm line-clamp-2'}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className={`text-gray-500 dark:text-gray-400 leading-relaxed ${featured ? 'text-sm line-clamp-2 mb-3' : 'text-xs line-clamp-2 mb-2'}`}>
            {post.excerpt}
          </p>
        )}
        {post.published_at && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(post.published_at)}</p>
        )}
      </div>
    </Link>
  )
}
