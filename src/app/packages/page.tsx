import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PackageCard } from '@/components/packages/package-card'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: packages } = await supabase
    .from('packages')
    .select('*, package_templates(template_id, templates(id, name, category))')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Chọn gói phù hợp</h1>
          <p className="text-gray-500">Mua theo gói để tiết kiệm hơn và truy cập nhiều templates hơn</p>
        </div>

        {packages && packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p>Chưa có gói nào. Vui lòng quay lại sau.</p>
          </div>
        )}
      </div>
    </div>
  )
}
