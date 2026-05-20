import Link from 'next/link'
import { Users } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">KK</div>
            KKhome
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Marketplace templates Google Sheets chuyên nghiệp cho doanh nghiệp Việt.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Khám phá</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link href="/templates" className="hover:text-gray-900">Templates</Link></li>
            <li><Link href="/packages" className="hover:text-gray-900">Gói mua</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Tài khoản</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link href="/login" className="hover:text-gray-900">Đăng nhập</Link></li>
            <li><Link href="/register" className="hover:text-gray-900">Đăng ký</Link></li>
            <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Hỗ trợ 24/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        © 2026 KKhome. Mọi quyền được bảo lưu.
      </div>
    </footer>
  )
}
