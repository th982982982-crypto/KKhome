import { notFound } from 'next/navigation'
import { LEGAL_DOCS, getDocBySlug } from '@/lib/legal/registry'
import { LegalViewer } from '@/components/legal/legal-viewer'

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }))
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = getDocBySlug(slug)
  if (!doc) notFound()

  return <LegalViewer currentSlug={slug} allDocs={LEGAL_DOCS} />
}
