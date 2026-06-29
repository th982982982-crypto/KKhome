import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [rowsRes, filesRes] = await Promise.all([
    supabase
      .from('tax_data_rows')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ĐƯỢC CỘNG'),
    supabase
      .from('tax_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false }),
  ])

  return NextResponse.json({
    rows: rowsRes.data ?? [],
    files: filesRes.data ?? [],
  })
}
