import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runGtgtSequenceAudit, runRevenueCrossAudit, buildNotesMap } from '@/lib/tax/audit-engine'
import type { TaxDataRow } from '@/lib/supabase/types'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mst = new URL(req.url).searchParams.get('mst')
  if (!mst) return NextResponse.json({ error: 'mst required' }, { status: 400 })

  const [rowsRes, notesRes] = await Promise.all([
    supabase
      .from('tax_data_rows')
      .select('*')
      .eq('user_id', user.id)
      .eq('mst', mst)
      .eq('status', 'ĐƯỢC CỘNG'),
    supabase
      .from('tax_audit_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('mst', mst),
  ])

  const rows = (rowsRes.data ?? []) as TaxDataRow[]
  const notesMap = buildNotesMap(notesRes.data ?? [])

  const gtgtRows = rows.filter((r) => r.declaration_type === 'GTGT')
  const tndnRows = rows.filter((r) => r.declaration_type === 'TNDN')

  return NextResponse.json({
    mst,
    gtgtAudit: runGtgtSequenceAudit(gtgtRows, mst, notesMap),
    revenueAudit: runRevenueCrossAudit(gtgtRows, tndnRows, mst, notesMap),
  })
}
