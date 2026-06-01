import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Lock, MessageCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Chưa đăng nhập
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-3">
              Vui lòng đăng nhập
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              Khu vực Tra cứu Pháp luật yêu cầu đăng nhập và được cấp quyền truy cập.
              Vui lòng đăng nhập hoặc mua gói thành viên để được hỗ trợ.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Mua gói thành viên
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.is_admin || user.user_metadata?.can_view_legal

  // Đã đăng nhập nhưng chưa được cấp quyền
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={false} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 mb-3">
              Tài khoản chưa được cấp quyền
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              Khu vực Tra cứu Pháp luật yêu cầu quyền truy cập đặc biệt.
              Vui lòng mua gói thành viên hoặc liên hệ hỗ trợ để được cấp quyền.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/packages"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Mua gói thành viên
              </Link>
              <a
                href="https://zalo.me/0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={true} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  )
}
