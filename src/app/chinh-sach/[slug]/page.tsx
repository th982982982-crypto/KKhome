import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import type { Policy } from '@/lib/supabase/types'

export const revalidate = 60

const POLICY_ORDER = [
  { slug: 'bao-mat', label: 'Bảo mật thông tin' },
  { slug: 'xac-nhan-don-hang', label: 'Xác nhận đơn hàng' },
  { slug: 'bao-hanh', label: 'Bảo hành, bảo trì' },
  { slug: 'doi-tra', label: 'Đổi trả và hoàn tiền' },
  { slug: 'thanh-toan', label: 'Hình thức thanh toán' },
  { slug: 'gia', label: 'Chính sách giá' },
]

export async function generateStaticParams() {
  return POLICY_ORDER.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('policies').select('title').eq('slug', slug).single()
  return { title: data?.title ?? 'Chính sách' }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!policy) notFound()

  const p = policy as Policy

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 dark:text-gray-300">{p.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar nav */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sticky top-6">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Chính sách</p>
              <ul className="space-y-0.5">
                {POLICY_ORDER.map(item => (
                  <li key={item.slug}>
                    <Link
                      href={`/chinh-sach/${item.slug}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${item.slug === slug
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <article className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-2">{p.title}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
              Cập nhật: {new Date(p.updated_at).toLocaleDateString('vi-VN')}
            </p>
            {p.content ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {p.content}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nội dung đang được cập nhật.</p>
            )}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
