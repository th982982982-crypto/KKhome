'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Settings,
  Loader2,
  Menu,
  X,
  FileSpreadsheet,
  Package,
  Scale,
  Receipt,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Newspaper,
  FileText,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface NavbarProps {
  user?: { email?: string | null; user_metadata?: { full_name?: string } | null } | null
  isAdmin?: boolean
  canViewLegal?: boolean
  canViewTax?: boolean
  isTaiLieuPublic?: boolean
  children?: ReactNode
}

export function Navbar({
  user,
  isAdmin,
  canViewLegal,
  canViewTax,
  isTaiLieuPublic = true,
  children,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const cartItems = useCartStore((s) => s.items)
  const cartCount = cartItems.length
  const cartTotal = useCartStore((s) => s.total)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cartOpen) return
    function handleClick(e: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [cartOpen])

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    clearCart()
    router.push('/')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0]

  const navLinks = [
    {
      href: '/templates',
      label: 'Templates',
      icon: FileSpreadsheet,
      activeColor: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border-l-4 border-emerald-600 shadow-sm',
      inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      href: '/packages',
      label: 'Gói mua',
      icon: Package,
      activeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold border-l-4 border-amber-600 shadow-sm',
      inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    ...(isAdmin || isTaiLieuPublic
      ? [
          {
            href: '/tai-lieu',
            label: 'Tài liệu',
            icon: FileText,
            activeColor: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold border-l-4 border-blue-600 shadow-sm',
            inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300',
            iconColor: 'text-blue-600 dark:text-blue-400',
          },
        ]
      : []),
    {
      href: '/legal',
      label: 'Pháp luật',
      icon: Scale,
      activeColor: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold border-l-4 border-purple-600 shadow-sm',
      inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      href: '/tax',
      label: 'Tờ Khai Thuế',
      icon: Receipt,
      activeColor: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold border-l-4 border-teal-600 shadow-sm',
      inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-300',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      href: '/tin-tuc',
      label: 'Tin tức',
      icon: Newspaper,
      activeColor: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold border-l-4 border-rose-600 shadow-sm',
      inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    ...(user
      ? [
          {
            href: '/dashboard',
            label: 'Templates của tôi',
            icon: LayoutDashboard,
            activeColor: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold border-l-4 border-indigo-600 shadow-sm',
            inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:text-indigo-700 dark:hover:text-indigo-300',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: 'Quản trị Admin',
            icon: Settings,
            activeColor: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-bold border-l-4 border-slate-700 shadow-sm',
            inactiveColor: 'text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
            iconColor: 'text-slate-700 dark:text-slate-400',
          },
        ]
      : []),
  ]

  // Sidebar Component for Desktop & Drawer
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Brand Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
        <Link
          href="/"
          className={`flex items-center gap-2.5 font-black text-gray-900 dark:text-gray-50 tracking-tight transition-all ${
            collapsed ? 'lg:justify-center lg:w-full' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="KKhome"
              width={34}
              height={34}
              className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
              priority
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-gray-50">KKhome</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Templates & Pháp Lý</span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-7 h-7 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 items-center justify-center transition-colors"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Menu chính
          </div>
        )}

        {navLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive ? item.activeColor : item.inactiveColor
              } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${item.iconColor}`} />
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Footer Actions (Cart, Theme, Profile) */}
      <div className="shrink-0 p-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5 bg-gray-50/50 dark:bg-gray-950/40">
        {/* Cart Popover Button */}
        <div ref={cartRef} className="relative">
          <button
            onClick={() => setCartOpen((o) => !o)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all shadow-sm ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            title="Xem giỏ hàng"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Giỏ hàng</span>}
            </div>

            {!collapsed && (
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {cartCount > 0 ? formatCurrency(cartTotal()) : '0 đ'}
              </span>
            )}
          </button>

          {/* Cart Popover Content (opens to right on desktop, dropdown on mobile) */}
          {cartOpen && (
            <div className="fixed lg:absolute left-4 right-4 lg:left-full lg:right-auto bottom-20 lg:bottom-0 lg:ml-3 w-auto lg:w-[350px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-[100] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="font-bold text-gray-900 dark:text-gray-50 text-sm">
                  Giỏ hàng {cartCount > 0 && <span className="text-gray-400 font-normal">({cartCount})</span>}
                </span>
                {cartCount > 0 && (
                  <button onClick={() => clearCart()} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Xóa tất cả
                  </button>
                )}
              </div>

              {cartCount === 0 ? (
                <div className="py-8 px-4 text-center">
                  <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Giỏ hàng trống</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Khám phá các Templates và Gói mua</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center text-sm">
                        {item.thumbnail_url ? (
                          <Image src={item.thumbnail_url} alt={item.name} width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          '📊'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.sale_price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {cartCount > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Tổng cộng</span>
                    <span className="text-sm font-black text-gray-900 dark:text-gray-50">{formatCurrency(cartTotal())}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/cart" onClick={() => setCartOpen(false)}>
                      <Button variant="outline" className="w-full h-8 text-xs rounded-lg">Giỏ hàng</Button>
                    </Link>
                    <Link href="/checkout" onClick={() => setCartOpen(false)}>
                      <Button className="w-full h-8 text-xs rounded-lg bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
                        Thanh toán <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle & User Info */}
        <div className={`flex items-center justify-between gap-2 ${collapsed ? 'lg:flex-col' : ''}`}>
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  collapsed ? 'lg:justify-center' : 'flex-1 min-w-0'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {(displayName || 'U').charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{displayName}</span>
                    <span className="text-[10px] text-gray-400 truncate">{user.email}</span>
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Templates của tôi
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Settings className="w-4 h-4 mr-2" /> Quản trị Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600 focus:text-red-700">
                  {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={`flex items-center gap-1.5 ${collapsed ? 'lg:flex-col' : ''}`}>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">Đăng nhập</Button>
              </Link>
              {!collapsed && (
                <Link href="/register">
                  <Button size="sm" className="h-8 px-2 text-xs bg-black dark:bg-white text-white dark:text-gray-900">Đăng ký</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const mobileHeader = (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50">
        <Image src="/logo.png" alt="KKhome" width={28} height={28} className="w-7 h-7 object-contain" priority />
        <span className="font-black text-base">KKhome</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => setCartOpen((o) => !o)}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          aria-label="Giỏ hàng"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          aria-label="Mở menu bên trái"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  )

  const mobileDrawer = mobileOpen && (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      <div className="absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-10">
        {sidebarContent}
      </div>
    </div>
  )

  // If children is passed, Navbar acts as the full Site Shell
  if (children) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 lg:flex">
        {mobileHeader}
        {mobileDrawer}

        {/* Desktop Sidebar (Sticky on Left) */}
        <aside
          className={`hidden lg:flex flex-col sticky top-0 h-screen border-r border-gray-100 dark:border-gray-800 z-40 transition-all duration-200 shrink-0 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          {sidebarContent}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    )
  }

  // Backward compatibility when rendered as self-closing tag
  return (
    <>
      {mobileHeader}
      {mobileDrawer}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 h-screen border-r border-gray-100 dark:border-gray-800 z-40 transition-all duration-200 bg-white dark:bg-gray-900 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
