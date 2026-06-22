import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import type { SiteSettings } from '@/lib/supabase/types'

const DEFAULTS: Pick<SiteSettings, 'brand_name' | 'brand_description' | 'contact_hours' | 'copyright_text'> = {
  brand_name: 'KK HOME',
  brand_description: 'Marketplace templates Google Sheets chuyên nghiệp cho doanh nghiệp Việt.',
  contact_hours: '08:00 – 21:30',
  copyright_text: 'Copyright © 2026 KK HOME. All rights reserved.',
}

export async function SiteFooter() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('site_settings').select('*').limit(1).single()
  const s = (data ?? {}) as Partial<SiteSettings>

  const brandName = s.brand_name || DEFAULTS.brand_name
  const brandDescription = s.brand_description || DEFAULTS.brand_description
  const copyrightText = s.copyright_text || DEFAULTS.copyright_text

  const businessLegalLine = s.business_name
    ? [
        `Website thuộc sở hữu của ${s.business_name}`,
        s.business_license_no && `Giấy chứng nhận Đăng ký Hộ kinh doanh số: ${s.business_license_no}`,
        s.business_license_issuer && `do ${s.business_license_issuer}`,
        s.business_license_date && `cấp lần đầu ngày ${s.business_license_date}`,
      ].filter(Boolean).join(' | ')
    : null

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-50 mb-3">
            <Image src="/logo.png" alt={brandName} width={36} height={36} className="w-9 h-9 object-contain" />
            {brandName}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
            {brandDescription}
          </p>
          {(s.facebook_url || s.zalo_url || s.youtube_url) && (
            <div className="flex items-center gap-2 mt-4">
              {s.facebook_url && (
                <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06z"/></svg>
                </a>
              )}
              {s.zalo_url && (
                <a href={s.zalo_url} target="_blank" rel="noopener noreferrer" aria-label="Zalo"
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {s.youtube_url && (
                <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.13-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.37.56A3.02 3.02 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3.02 3.02 0 0 0 2.13 2.14C4.49 20.5 12 20.5 12 20.5s7.51 0 9.37-.56a3.02 3.02 0 0 0 2.13-2.14c.5-1.87.5-5.8.5-5.8s0-3.93-.5-5.8zM9.6 15.57V8.43L15.82 12 9.6 15.57z"/></svg>
                </a>
              )}
            </div>
          )}
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
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Chính sách</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li><Link href="/chinh-sach/bao-mat" className="hover:text-gray-900 dark:hover:text-gray-50">Bảo mật thông tin</Link></li>
            <li><Link href="/chinh-sach/xac-nhan-don-hang" className="hover:text-gray-900 dark:hover:text-gray-50">Xác nhận đơn hàng</Link></li>
            <li><Link href="/chinh-sach/bao-hanh" className="hover:text-gray-900 dark:hover:text-gray-50">Bảo hành, bảo trì</Link></li>
            <li><Link href="/chinh-sach/doi-tra" className="hover:text-gray-900 dark:hover:text-gray-50">Đổi trả</Link></li>
            <li><Link href="/chinh-sach/thanh-toan" className="hover:text-gray-900 dark:hover:text-gray-50">Hình thức thanh toán</Link></li>
            <li><Link href="/chinh-sach/gia" className="hover:text-gray-900 dark:hover:text-gray-50">Chính sách giá</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Liên hệ</h4>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            {s.contact_hours && (
              <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {s.contact_hours}</li>
            )}
            {s.contact_phone && (
              <li>
                <a href={`tel:${s.contact_phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-50">
                  <Phone className="w-3.5 h-3.5 shrink-0" /> {s.contact_phone}
                </a>
              </li>
            )}
            {s.contact_email && (
              <li>
                <a href={`mailto:${s.contact_email}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-50 break-all">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {s.contact_email}
                </a>
              </li>
            )}
            {s.contact_address && (
              <li className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {s.contact_address}</li>
            )}
            {!s.contact_hours && !s.contact_phone && !s.contact_email && !s.contact_address && (
              <li className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {DEFAULTS.contact_hours}</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 py-5 px-4 text-center text-xs text-gray-400 dark:text-gray-500 space-y-2">
        {s.mocongthuong_url && (
          <div className="flex justify-center">
            <a
              href={s.mocongthuong_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Đã thông báo Bộ Công Thương"
              className="inline-block"
            >
              <Image
                src="/logo-bo-cong-thuong.png"
                alt="Đã thông báo Bộ Công Thương"
                width={150}
                height={57}
                className="h-12 w-auto"
              />
            </a>
          </div>
        )}
        {businessLegalLine && <p>{businessLegalLine}</p>}
        <p>{copyrightText}</p>
      </div>
    </footer>
  )
}
