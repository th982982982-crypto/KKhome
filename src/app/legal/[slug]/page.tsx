import { notFound } from 'next/navigation'
import { LEGAL_DOCS, getDocBySlug } from '@/lib/legal/registry'
import { buildCatalog } from '@/lib/legal/catalog'
import { LegalViewer } from '@/components/legal/legal-viewer'

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }))
}

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

  const catalog = buildCatalog(LEGAL_DOCS)

  return <LegalViewer currentSlug={slug} allDocs={LEGAL_DOCS} catalog={catalog} anchor={anchor} />
}
