import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'
import { hasTaxAccess } from '@/lib/tax/has-tax-access'
import { Lock, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

function FreemiumBanner({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4 flex-wrap">
      <span className="flex items-center gap-2">
        <Lock className="w-4 h-4 shrink-0" />
        {loggedIn
          ? 'Bạn đang xem miễn phí — Tham chiếu chéo & tải biểu mẫu yêu cầu gói Pháp luật.'
          : 'Đăng nhập và mua gói Pháp luật để dùng Tham chiếu chéo và tải Biểu mẫu.'}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {!loggedIn && (
          <Link href="/login?redirect=/legal" className="text-xs font-semibold underline">
            Đăng nhập
          </Link>
        )}
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Xem gói
        </Link>
      </div>
    </div>
  )
}

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { is_admin: boolean; legal_access_until: string | null; tax_access_until: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, legal_access_until, tax_access_until')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const hasAccess = hasLegalAccess(profile)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user ?? undefined}
        isAdmin={!!profile?.is_admin}
        canViewLegal={true}
        canViewTax={hasTaxAccess(profile)}
      />
      {!hasAccess && <FreemiumBanner loggedIn={!!user} />}
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  )
}
