import { createAdminClient } from '@/lib/supabase/server'
import { PromotionManager } from '@/components/admin/promotion-manager'
import { Tag } from 'lucide-react'
import type { PromotionWithTemplates } from '@/lib/supabase/types'

export const revalidate = 0

export default async function AdminPromotionsPage() {
  const supabase = createAdminClient()
  const [{ data: promoData }, { data: templates }] = await Promise.all([
    supabase.from('promotions').select('*, promotion_templates(template_id)').order('created_at', { ascending: false }),
    supabase.from('templates').select('id, name, sku').order('sort_order'),
  ])

  const promotions: PromotionWithTemplates[] = (promoData ?? []).map((p) => ({
    ...p,
    template_ids: (p.promotion_templates ?? []).map((pt: { template_id: string }) => pt.template_id),
    promotion_templates: undefined,
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <Tag className="w-4 h-4" />
          <span>Khuyến mãi</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Quản lý khuyến mãi</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tạo chương trình giảm giá có thời hạn cho templates</p>
      </div>
      <PromotionManager initialPromotions={promotions} templates={templates ?? []} />
    </div>
  )
}
