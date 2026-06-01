import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { CheckoutContent } from './checkout-content'

export const revalidate = 0

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  let canViewLegal = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin, can_view_legal').eq('id', user.id).single()
    isAdmin = !!profile?.is_admin
    canViewLegal = !!profile?.is_admin || !!profile?.can_view_legal
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar user={user} isAdmin={isAdmin} canViewLegal={canViewLegal} />
      <main className="flex-1">
        <CheckoutContent />
      </main>
      <SiteFooter />
    </div>
  )
}
