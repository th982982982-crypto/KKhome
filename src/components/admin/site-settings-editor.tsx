'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import type { SiteSettings } from '@/lib/supabase/types'

interface FormState {
  brand_name: string
  brand_description: string
  business_name: string
  owner_name: string
  business_license_no: string
  business_license_date: string
  business_license_issuer: string
  contact_hours: string
  contact_phone: string
  contact_email: string
  contact_address: string
  facebook_url: string
  zalo_url: string
  youtube_url: string
  mocongthuong_url: string
  copyright_text: string
  support_auto_reply_enabled: boolean
  support_auto_reply_text: string
}

function toForm(s: SiteSettings): FormState {
  return {
    brand_name: s.brand_name ?? '',
    brand_description: s.brand_description ?? '',
    business_name: s.business_name ?? '',
    owner_name: s.owner_name ?? '',
    business_license_no: s.business_license_no ?? '',
    business_license_date: s.business_license_date ?? '',
    business_license_issuer: s.business_license_issuer ?? '',
    contact_hours: s.contact_hours ?? '',
    contact_phone: s.contact_phone ?? '',
    contact_email: s.contact_email ?? '',
    contact_address: s.contact_address ?? '',
    facebook_url: s.facebook_url ?? '',
    zalo_url: s.zalo_url ?? '',
    youtube_url: s.youtube_url ?? '',
    mocongthuong_url: s.mocongthuong_url ?? '',
    copyright_text: s.copyright_text ?? '',
    support_auto_reply_enabled: s.support_auto_reply_enabled ?? false,
    support_auto_reply_text: s.support_auto_reply_text ?? '',
  }
}

export function SiteSettingsEditor({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(toForm(initial))
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const payload: Record<string, string | boolean | null> = {}
    for (const [k, v] of Object.entries(form)) {
      if (typeof v === 'boolean') { payload[k] = v; continue }
      payload[k] = v.trim() === '' ? null : v
    }
    if (!form.brand_name.trim()) {
      toast.error('Tên brand không được để trống')
      setSaving(false)
      return
    }

    const res = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      toast.error(data.error || 'Lưu thất bại')
      return
    }
    toast.success('Đã lưu cài đặt')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Section title="Thương hiệu" desc="Tên và mô tả ngắn hiển thị ở header/footer">
        <Field label="Tên brand (hiển thị)">
          <input
            type="text"
            value={form.brand_name}
            onChange={(e) => setField('brand_name', e.target.value)}
            className={inputCls}
            placeholder="KK HOME"
          />
        </Field>
        <Field label="Mô tả ngắn">
          <textarea
            value={form.brand_description}
            onChange={(e) => setField('brand_description', e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="Marketplace templates Google Sheets…"
          />
        </Field>
      </Section>

      <Section title="Thông tin chủ sở hữu" desc="Thông tin pháp lý của đơn vị sở hữu website">
        <Field label="Tên đơn vị">
          <input
            type="text"
            value={form.business_name}
            onChange={(e) => setField('business_name', e.target.value)}
            className={inputCls}
            placeholder="HỘ KINH DOANH KK HOME"
          />
        </Field>
        <Field label="Người đại diện">
          <input
            type="text"
            value={form.owner_name}
            onChange={(e) => setField('owner_name', e.target.value)}
            className={inputCls}
            placeholder="Huỳnh Ngọc Ngân"
          />
        </Field>
      </Section>

      <Section title="Giấy phép kinh doanh" desc="Hiển thị ở dòng pháp lý cuối footer">
        <Field label="Số GCNĐKKD">
          <input
            type="text"
            value={form.business_license_no}
            onChange={(e) => setField('business_license_no', e.target.value)}
            className={inputCls}
            placeholder="087193019574"
          />
        </Field>
        <Field label="Cơ quan cấp">
          <input
            type="text"
            value={form.business_license_issuer}
            onChange={(e) => setField('business_license_issuer', e.target.value)}
            className={inputCls}
            placeholder="Ủy Ban Nhân dân Phường Mỹ Trà Tỉnh Đồng Tháp"
          />
        </Field>
        <Field label="Ngày cấp lần đầu">
          <input
            type="text"
            value={form.business_license_date}
            onChange={(e) => setField('business_license_date', e.target.value)}
            className={inputCls}
            placeholder="30/01/2026"
          />
        </Field>
      </Section>

      <Section title="Thông tin liên hệ" desc="Hiển thị ở cột Liên hệ trong footer">
        <Field label="Giờ hỗ trợ">
          <input
            type="text"
            value={form.contact_hours}
            onChange={(e) => setField('contact_hours', e.target.value)}
            className={inputCls}
            placeholder="Hỗ trợ 24/7"
          />
        </Field>
        <Field label="Số điện thoại">
          <input
            type="text"
            value={form.contact_phone}
            onChange={(e) => setField('contact_phone', e.target.value)}
            className={inputCls}
            placeholder="0901 234 567"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setField('contact_email', e.target.value)}
            className={inputCls}
            placeholder="hello@kkhome.com"
          />
        </Field>
        <Field label="Địa chỉ">
          <input
            type="text"
            value={form.contact_address}
            onChange={(e) => setField('contact_address', e.target.value)}
            className={inputCls}
            placeholder="Hà Nội, Việt Nam"
          />
        </Field>
      </Section>

      <Section title="Mạng xã hội" desc="Để trống để ẩn icon tương ứng">
        <Field label="Facebook URL">
          <input
            type="url"
            value={form.facebook_url}
            onChange={(e) => setField('facebook_url', e.target.value)}
            className={inputCls}
            placeholder="https://facebook.com/…"
          />
        </Field>
        <Field label="Zalo URL">
          <input
            type="url"
            value={form.zalo_url}
            onChange={(e) => setField('zalo_url', e.target.value)}
            className={inputCls}
            placeholder="https://zalo.me/…"
          />
        </Field>
        <Field label="YouTube URL">
          <input
            type="url"
            value={form.youtube_url}
            onChange={(e) => setField('youtube_url', e.target.value)}
            className={inputCls}
            placeholder="https://youtube.com/@…"
          />
        </Field>
      </Section>

      <Section title="Bộ Công Thương" desc="Dán link “WebDetails/…” từ tài khoản online.gov.vn để hiện logo “Đã thông báo Bộ Công Thương”. Để trống để ẩn.">
        <Field label="Link xác nhận online.gov.vn">
          <input
            type="url"
            value={form.mocongthuong_url}
            onChange={(e) => setField('mocongthuong_url', e.target.value)}
            className={inputCls}
            placeholder="http://online.gov.vn/Home/WebDetails/XXXXX"
          />
        </Field>
      </Section>

      <Section title="Trả lời tự động" desc="Tự động gửi khi khách nhắn tin lần đầu, giúp khách không phải chờ khi admin chưa kịp xem">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.support_auto_reply_enabled}
            onChange={(e) => setField('support_auto_reply_enabled', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bật trả lời tự động</span>
        </label>
        <Field label="Nội dung trả lời mẫu">
          <textarea
            value={form.support_auto_reply_text}
            onChange={(e) => setField('support_auto_reply_text', e.target.value)}
            rows={3}
            className={inputCls}
            placeholder="Cảm ơn bạn đã liên hệ! Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất."
          />
        </Field>
      </Section>

      <Section title="Bản quyền" desc="Dòng cuối footer">
        <Field label="Copyright">
          <input
            type="text"
            value={form.copyright_text}
            onChange={(e) => setField('copyright_text', e.target.value)}
            className={inputCls}
            placeholder="© 2026 KKhome. Mọi quyền được bảo lưu."
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm px-5 h-11 rounded-xl shadow-lg shadow-black/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 h-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500'

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-50">{title}</h2>
        {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
