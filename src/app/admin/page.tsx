import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingBag, FileSpreadsheet, Users, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: templateCount },
    { count: orderCount },
    { count: pendingCount },
    { count: userCount },
    { data: recentOrders },
    { data: confirmedRevenue },
  ] = await Promise.all([
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('id, order_code, total_amount, status, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('total_amount').eq('status', 'confirmed'),
  ])

  const totalRevenue = (confirmedRevenue ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0)

  const stats = [
    { label: 'Doanh thu xác nhận', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'from-emerald-100 to-teal-50', iconColor: 'text-emerald-600' },
    { label: 'Templates', value: templateCount ?? 0, icon: FileSpreadsheet, color: 'from-indigo-100 to-violet-50', iconColor: 'text-indigo-600' },
    { label: 'Đơn hàng', value: orderCount ?? 0, icon: ShoppingBag, color: 'from-amber-100 to-orange-50', iconColor: 'text-amber-600' },
    { label: 'Người dùng', value: userCount ?? 0, icon: Users, color: 'from-pink-100 to-rose-50', iconColor: 'text-pink-600' },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tổng quan hệ thống và đơn hàng</p>
      </div>

      {/* Pending alert */}
      {(pendingCount ?? 0) > 0 && (
        <Link href="/admin/orders" className="block mb-6 group">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-4 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-900 dark:text-amber-200">{pendingCount} đơn hàng chờ xác nhận</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Click để xem và xác nhận chuyển khoản</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-50 tracking-tight">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">Hành động nhanh</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { href: '/admin/templates', title: 'Quản lý Templates', desc: 'Thêm, sửa, xóa templates trực tiếp trên bảng', icon: FileSpreadsheet, color: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20' },
          { href: '/admin/orders', title: 'Xác nhận đơn hàng', desc: 'Xem và xác nhận các đơn chuyển khoản', icon: ShoppingBag, color: 'border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/20' },
          { href: '/admin/sync', title: 'Đồng bộ Google Sheets', desc: 'Kéo dữ liệu catalog từ Google Sheets', icon: Package, color: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20' },
        ].map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.href} href={a.href}>
              <div className={`group bg-white dark:bg-gray-900 rounded-2xl border-2 ${a.color} p-6 transition-all`}>
                <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300 mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-gray-50 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{a.desc}</p>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-50 inline-flex items-center gap-1">
                  Mở <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent orders */}
      {recentOrders && recentOrders.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Đơn hàng mới nhất</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 inline-flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {recentOrders.map((o, i) => {
              const statusBg = o.status === 'confirmed' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : o.status === 'cancelled' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              const statusLabel = o.status === 'confirmed' ? 'Đã xác nhận' : o.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'
              // @ts-expect-error supabase join shape
              const customerName = o.profiles?.full_name ?? '—'
              return (
                <div key={o.id} className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${i !== 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-50 shrink-0">{o.order_code}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-0 truncate">{customerName}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(o.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-50 shrink-0">{formatCurrency(o.total_amount)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBg} shrink-0`}>{statusLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
