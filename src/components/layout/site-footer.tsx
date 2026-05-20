import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50 mb-3">
            <Image src="/logo.png" alt="KKhome" width={36} height={36} className="w-9 h-9 object-contain" />
            KKhome
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Marketplace templates Google Sheets chuyên nghiệp cho doanh nghiệp Việt.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Khám phá</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/templates" className="hover:text-gray-900 dark:hover:text-gray-50">Templates</Link></li>
            <li><Link href="/packages" className="hover:text-gray-900 dark:hover:text-gray-50">Gói mua</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Tài khoản</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/login" className="hover:text-gray-900 dark:hover:text-gray-50">Đăng nhập</Link></li>
            <li><Link href="/register" className="hover:text-gray-900 dark:hover:text-gray-50">Đăng ký</Link></li>
            <li><Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-gray-50">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Hỗ trợ 24/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 py-5 text-center text-xs text-gray-400 dark:text-gray-500">
        © 2026 KKhome. Mọi quyền được bảo lưu.
      </div>
    </footer>
  )
}
