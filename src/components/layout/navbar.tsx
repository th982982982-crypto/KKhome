'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, User, LogOut, LayoutDashboard, Settings, Loader2, Menu, X, FileSpreadsheet, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
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
  user?: { email?: string | null } | null
  isAdmin?: boolean
}

export function Navbar({ user, isAdmin }: NavbarProps) {
  const cartCount = useCartStore((s) => s.items.length)
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-gray-900 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">KK</span>
            </div>
            <span className="whitespace-nowrap">KKhome</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
            <Link href="/templates" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">Templates</Link>
            <Link href="/packages" className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">Gói mua</Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative h-9 w-9 sm:w-auto sm:px-3">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {(user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline truncate max-w-32">
                    {user.email?.split('@')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
                  <Button size="sm" className="bg-black text-white hover:bg-gray-800">Đăng ký</Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100"
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
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2 rounded-lg hover:bg-gray-100" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              <Link href="/templates" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <FileSpreadsheet className="w-4 h-4 text-gray-400" /> Templates
              </Link>
              <Link href="/packages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                <Package className="w-4 h-4 text-gray-400" /> Gói mua
              </Link>
              {user && (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  <Settings className="w-4 h-4 text-gray-400" /> Quản trị
                </Link>
              )}
            </nav>
            <div className="p-3 border-t border-gray-100">
              {user ? (
                <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
                  {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Đăng xuất
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Đăng nhập</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-black text-white">Đăng ký</Button>
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
