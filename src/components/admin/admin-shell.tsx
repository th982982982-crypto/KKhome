'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/cart-store'
import {
  LayoutDashboard,
  FileSpreadsheet,
  ShoppingBag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
  ExternalLink,
  Menu,
  X,
  Tag,
  Settings,
  FileText,
} from 'lucide-react'

interface AdminShellProps {
  children: ReactNode
  user: { email?: string | null; full_name?: string | null } | null
  pendingCount?: number
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/templates', label: 'Sản phẩm & Gói', icon: FileSpreadsheet },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag, badgeKey: 'pending' as const },
  { href: '/admin/promotions', label: 'Khuyến mãi', icon: Tag },
  { href: '/admin/sync', label: 'Đồng bộ Sheets', icon: RefreshCw },
  { href: '/admin/policies', label: 'Chính sách', icon: FileText },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
]

export function AdminShell({ children, user, pendingCount = 0 }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    useCartStore.getState().clearCart()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50">
          <Image src="/logo.png" alt="KKhome" width={32} height={32} className="w-8 h-8 object-contain" priority />
          Admin
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200
          lg:h-screen
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-72
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
          <Link href="/admin" className={`flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50 ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <Image src="/logo.png" alt="KKhome" width={36} height={36} className="w-9 h-9 object-contain shrink-0" priority />
            {!collapsed && <span>Admin Panel</span>}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon
            const badge = item.badgeKey === 'pending' ? pendingCount : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${active
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50'
                  }
                  ${collapsed ? 'lg:justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && badge > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'}`}>
                    {badge}
                  </span>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute ml-7 mt-[-12px] w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 ${collapsed ? 'lg:justify-center' : ''}`}
            title={collapsed ? 'Xem site' : undefined}
          >
            <ExternalLink className="w-4 h-4" />
            {!collapsed && 'Xem site'}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 ${collapsed ? 'lg:justify-center' : ''}`}
            title={collapsed ? 'Đăng xuất' : undefined}
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {!collapsed && (loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất')}
          </button>

          {/* User */}
          {user && (
            <div className={`mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200 shrink-0">
                  {(user.full_name || user.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-50 truncate">{user.full_name || user.email}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Thu gọn</>}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
