import { redirect } from 'next/navigation'
import { LEGAL_DOCS } from '@/lib/legal/registry'

export default function LegalPage() {
  redirect(`/legal/${LEGAL_DOCS[0].slug}`)
}
