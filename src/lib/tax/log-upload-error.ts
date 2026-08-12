import { createAdminClient } from '@/lib/supabase/server'

export async function logTaxUploadError(params: {
  userId: string
  fileName: string
  source: 'tax_upload' | 'tax_payment_upload'
  errorMessage: string
  rawXml: string
  mst?: string | null
  tenNnt?: string | null
  tenTkhai?: string | null
}) {
  const admin = createAdminClient()
  await admin.from('tax_upload_errors').insert({
    user_id: params.userId,
    file_name: params.fileName,
    source: params.source,
    error_message: params.errorMessage,
    raw_xml: params.rawXml,
    mst: params.mst ?? null,
    ten_nnt: params.tenNnt ?? null,
    ten_tkhai: params.tenTkhai ?? null,
  })
}
