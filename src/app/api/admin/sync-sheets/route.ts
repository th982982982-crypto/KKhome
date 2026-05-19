import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchCatalogSheet, parseSheetRows, transformToTemplate, mapHeaders } from '@/lib/google-sheets'

export async function POST(req: Request) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { preview } = await req.json().catch(() => ({ preview: false }))

  const { headers, rows } = await fetchCatalogSheet()

  if (!headers.length) {
    return NextResponse.json({ error: 'Empty sheet or no headers found' }, { status: 400 })
  }

  const mapping = mapHeaders(headers)
  const parsedRows = parseSheetRows(headers, rows)
  const templates = parsedRows.map(transformToTemplate)

  if (preview) {
    return NextResponse.json({ headers, mapping, preview: templates.slice(0, 3), total: templates.length })
  }

  // Upsert into Supabase
  const { error } = await supabase
    .from('templates')
    .upsert(templates, { onConflict: 'slug', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, synced: templates.length })
}
