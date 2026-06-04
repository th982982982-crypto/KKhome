import { LEGAL_DOCS } from '@/lib/legal/registry'
import { buildCatalog } from '@/lib/legal/catalog'
import { LegalLibrary } from '@/components/legal/legal-library'

export default function LegalPage() {
  const catalog = buildCatalog(LEGAL_DOCS)
  return <LegalLibrary catalog={catalog} />
}
