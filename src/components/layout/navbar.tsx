'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogOut, LayoutDashboard, Settings } from 'lucide-react'
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            Template Store
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/templates" className="hover:text-gray-900 transition-colors">Templates</Link>
            <Link href="/packages" className="hover:text-gray-900 transition-colors">Gói mua</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline truncate max-w-32">
                    {user.email?.split('@')[0]}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />Templates của tôi
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                      <Settings className="w-4 h-4 mr-2" />Quản trị
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-black text-white hover:bg-gray-800">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
