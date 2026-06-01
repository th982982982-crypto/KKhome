import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { CartContent } from './cart-content'

export const revalidate = 0

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  let canViewLegal = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    isAdmin = !!profile?.is_admin
    canViewLegal = !!profile?.is_admin || !!user?.user_metadata?.can_view_legal
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar user={user} isAdmin={isAdmin} canViewLegal={canViewLegal} />
      <main className="flex-1">
        <CartContent />
      </main>
      <SiteFooter />
    </div>
  )
}
