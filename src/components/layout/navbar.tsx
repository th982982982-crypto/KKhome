'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, LogOut, LayoutDashboard, Settings, Loader2, Menu, X, FileSpreadsheet, Package, Scale, Receipt, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCartStore } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavbarProps {
  user?: { email?: string | null; user_metadata?: { full_name?: string } | null } | null
  isAdmin?: boolean
  canViewLegal?: boolean
  canViewTax?: boolean
}

export function Navbar({ user, isAdmin, canViewLegal, canViewTax }: NavbarProps) {
  const cartItems = useCartStore((s) => s.items)
  const cartCount = cartItems.length
  const cartTotal = useCartStore((s) => s.total)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
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

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-50 shrink-0">
            <Image src="/logo.png" alt="KKhome" width={36} height={36} className="w-9 h-9 object-contain" priority />
            <span className="whitespace-nowrap">KKhome</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link href="/templates" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-colors">Templates</Link>
            <Link href="/packages" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-colors">Gói mua</Link>
            <Link href="/legal" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-colors">
              <Scale className="w-3.5 h-3.5" />Pháp luật
            </Link>
            <Link href="/tax" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50 transition-colors">
              <Receipt className="w-3.5 h-3.5" />Tờ Khai
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />

            {/* Mini-cart popover */}
            <div ref={cartRef} className="relative">
              <button
                onClick={() => setCartOpen((o) => !o)}
                className="relative flex items-center justify-center h-9 w-9 sm:w-auto sm:px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-950">
                    {cartCount}
                  </span>
                )}
              </button>

              {cartOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-[100] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-gray-50 text-sm">
                      Giỏ hàng {cartCount > 0 && <span className="text-gray-400 dark:text-gray-500 font-normal">({cartCount} sản phẩm)</span>}
                    </span>
                    {cartCount > 0 && (
                      <button onClick={() => clearCart()} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Xóa tất cả</button>
                    )}
                  </div>

                  {/* Items */}
                  {cartCount === 0 ? (
                    <div className="py-10 px-4 text-center">
                      <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Giỏ hàng trống</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Khám phá Templates và Gói mua</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                      {cartItems.map((item) => {
                        const typeLabel = item.type === 'package' ? 'Gói bundle' : item.type === 'legal_plan' ? 'Pháp luật' : item.type === 'tax_plan' ? 'Tờ Khai Thuế' : 'Template'
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 overflow-hidden shrink-0 flex items-center justify-center text-base">
                              {item.thumbnail_url
                                ? <Image src={item.thumbnail_url} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                                : item.type === 'legal_plan' ? '⚖️' : item.type === 'tax_plan' ? '🧾' : '📊'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">{typeLabel}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-50 shrink-0">{formatCurrency(item.sale_price)}</span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  {cartCount > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Tổng cộng</span>
                        <span className="text-lg font-black text-gray-900 dark:text-gray-50">{formatCurrency(cartTotal())}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/cart" onClick={() => setCartOpen(false)}>
                          <Button variant="outline" className="w-full h-9 text-sm rounded-xl">Xem giỏ hàng</Button>
                        </Link>
                        <Link href="/checkout" onClick={() => setCartOpen(false)}>
                          <Button className="w-full h-9 text-sm rounded-xl bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
                            Thanh toán <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-200">
                    {(displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline truncate max-w-40 font-semibold text-gray-800 dark:text-gray-100">
                    {displayName}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-2 py-2 mb-1 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                      {user.user_metadata?.full_name || 'Khách hàng'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />Templates của tôi
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>
                      <Settings className="w-4 h-4 mr-2" />Quản trị
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600 focus:text-red-700">
                    {isLoggingOut
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đăng xuất...</>
                      : <><LogOut className="w-4 h-4 mr-2" />Đăng xuất</>
                    }
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">Đăng ký</Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-gray-50">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <Link href="/templates" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <FileSpreadsheet className="w-4 h-4 text-gray-400" /> Templates
              </Link>
              <Link href="/packages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Package className="w-4 h-4 text-gray-400" /> Gói mua
              </Link>
              {user && (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                </Link>
              )}
              <Link href="/legal" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Scale className="w-4 h-4 text-gray-400" /> Pháp luật
              </Link>
              <Link href="/tax" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Receipt className="w-4 h-4 text-gray-400" /> Tờ Khai Thuế
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Settings className="w-4 h-4 text-gray-400" /> Quản trị
                </Link>
              )}
            </nav>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              {user ? (
                <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                  {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Đăng xuất
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Đăng nhập</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-black dark:bg-white text-white dark:text-gray-900">Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
