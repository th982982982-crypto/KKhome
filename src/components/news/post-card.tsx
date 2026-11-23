import Link from 'next/link'
import Image from 'next/image'
import type { NewsPost } from '@/lib/supabase/types'
import { Calendar, ArrowRight } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = { tin_tuc: 'Tin tức', quang_cao: 'Quảng cáo' }

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface PostCardProps {
  post: NewsPost
  featured?: boolean
  variant?: 'grid' | 'list'
}

export function PostCard({ post, featured = false, variant = 'list' }: PostCardProps) {
  // ==========================================
  // DẠNG DANH SÁCH (LIST VIEW) - Mặc định
  // ==========================================
  if (variant === 'list') {
    return (
      <Link
        href={`/tin-tuc/${post.slug}`}
        className="group flex flex-col md:flex-row gap-5 p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-black/60 transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/60"
      >
        {/* Thumbnail bên trái */}
        <div className="relative w-full md:w-72 lg:w-80 shrink-0 aspect-[16/10] rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <span className="text-gray-300 dark:text-gray-600 text-4xl">📰</span>
            </div>
          )}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
                post.post_type === 'quang_cao' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              {TYPE_LABEL[post.post_type]}
            </span>
          </div>
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {post.category && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {post.category}
                </span>
              )}
              {post.category && post.published_at && (
                <span className="text-gray-300 dark:text-gray-700">·</span>
              )}
              {post.published_at && (
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(post.published_at)}
                </span>
              )}
            </div>

            <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug mb-2 line-clamp-2">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-50 dark:border-gray-800/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.tags &&
                post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
            </div>

            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
              Đọc chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // ==========================================
  // DẠNG LƯỚI (GRID VIEW)
  // ==========================================
  return (
    <Link
      href={`/tin-tuc/${post.slug}`}
      className={`group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/40 hover:shadow-xl dark:hover:shadow-black/60 hover:-translate-y-1 transition-all duration-300 ${
        featured ? 'sm:col-span-2' : ''
      }`}
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
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
              post.post_type === 'quang_cao' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
            }`}
          >
            {TYPE_LABEL[post.post_type]}
          </span>
        </div>
      </div>
      <div className={featured ? 'p-5 sm:p-6' : 'p-4'}>
        {post.category && (
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            {post.category}
          </span>
        )}
        <h3
          className={`font-bold text-gray-900 dark:text-gray-50 leading-snug mt-1 mb-1.5 group-hover:text-black dark:group-hover:text-white ${
            featured ? 'text-xl sm:text-2xl line-clamp-2' : 'text-sm line-clamp-2'
          }`}
        >
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
