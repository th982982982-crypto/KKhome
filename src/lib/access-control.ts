import { createClient } from './supabase/server'

export async function userCanViewTemplate(userId: string, templateId: string): Promise<boolean> {
  const supabase = await createClient()

  // 1. Direct template purchase
  const { data: direct } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('purchase_type', 'template')
    .eq('template_id', templateId)
    .maybeSingle()

  if (direct) return true

  // 2. Package purchase that includes this template
  const { data: packages } = await supabase
    .from('user_purchases')
    .select('package_id')
    .eq('user_id', userId)
    .eq('purchase_type', 'package')

  if (!packages?.length) return false

  const packageIds = packages.map((p) => p.package_id).filter(Boolean) as string[]

  const { data: packageTemplate } = await supabase
    .from('package_templates')
    .select('package_id')
    .in('package_id', packageIds)
    .eq('template_id', templateId)
    .maybeSingle()

  return !!packageTemplate
}

export async function getUserPurchasedTemplateIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const ids = new Set<string>()

  // Direct purchases
  const { data: directs } = await supabase
    .from('user_purchases')
    .select('template_id')
    .eq('user_id', userId)
    .eq('purchase_type', 'template')

  directs?.forEach((d) => d.template_id && ids.add(d.template_id))

  // Package purchases
  const { data: packages } = await supabase
    .from('user_purchases')
    .select('package_id')
    .eq('user_id', userId)
    .eq('purchase_type', 'package')

  if (packages?.length) {
    const packageIds = packages.map((p) => p.package_id).filter(Boolean) as string[]
    const { data: pts } = await supabase
      .from('package_templates')
      .select('template_id')
      .in('package_id', packageIds)

    pts?.forEach((pt) => ids.add(pt.template_id))
  }

  return Array.from(ids)
}
