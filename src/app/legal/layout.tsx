import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'

export const revalidate = 0

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, can_view_legal')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && !profile?.can_view_legal) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} isAdmin={profile.is_admin} canViewLegal={true} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  )
}
