import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Package, ShoppingBag, FileSpreadsheet, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const [{ count: templateCount }, { count: orderCount }, { count: pendingCount }, { count: userCount }] = await Promise.all([
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Templates', value: templateCount ?? 0, icon: <FileSpreadsheet className="w-5 h-5" />, href: '/templates' },
    { label: 'Đơn hàng', value: orderCount ?? 0, icon: <ShoppingBag className="w-5 h-5" />, href: '/admin/orders' },
    { label: 'Chờ xác nhận', value: pendingCount ?? 0, icon: <Package className="w-5 h-5" />, href: '/admin/orders', highlight: (pendingCount ?? 0) > 0 },
    { label: 'Người dùng', value: userCount ?? 0, icon: <Users className="w-5 h-5" />, href: '#' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={true} />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Quản trị</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${stat.highlight ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.highlight ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/orders">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
              <h2 className="font-semibold text-gray-900 mb-1">Xác nhận đơn hàng</h2>
              <p className="text-sm text-gray-500">Xem và xác nhận các đơn chuyển khoản thủ công</p>
            </div>
          </Link>
          <Link href="/admin/sync">
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
              <h2 className="font-semibold text-gray-900 mb-1">Đồng bộ Google Sheets</h2>
              <p className="text-sm text-gray-500">Kéo dữ liệu catalog từ Google Sheets vào hệ thống</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
