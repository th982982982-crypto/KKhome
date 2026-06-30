import { notFound } from 'next/navigation'
import { LEGAL_DOCS, getDocBySlug } from '@/lib/legal/registry'
import { buildCatalog } from '@/lib/legal/catalog'
import { LegalViewer } from '@/components/legal/legal-viewer'
import { createClient } from '@/lib/supabase/server'
import { hasLegalAccess } from '@/lib/legal/has-legal-access'

// force-dynamic: trang cần auth cookie để tính hasAccess, không thể static render
export const dynamic = 'force-dynamic'

export default async function LegalDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ anchor?: string }>
}) {
  const [{ slug }, { anchor }] = await Promise.all([params, searchParams])
  const doc = getDocBySlug(slug)
  if (!doc) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let hasAccess = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, legal_access_until')
      .eq('id', user.id)
      .single()
    hasAccess = hasLegalAccess(profile)
  }

  const catalog = buildCatalog(LEGAL_DOCS)

  return (
    <LegalViewer
      currentSlug={slug}
      allDocs={LEGAL_DOCS}
      catalog={catalog}
      anchor={anchor}
      hasAccess={hasAccess}
    />
  )
}
