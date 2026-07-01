import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, tax_access_until, tax_trial_started_at, tax_trial_count, tax_trial_max_count')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.is_admin) return NextResponse.json({ error: 'Admin không cần trial' }, { status: 400 })

  // Đã có subscription
  if (profile.tax_access_until) {
    const t = new Date(profile.tax_access_until).getTime()
    if (!Number.isFinite(t) || t > Date.now()) {
      return NextResponse.json({ error: 'Bạn đã có gói trả phí' }, { status: 400 })
    }
  }

  // Trial đang chạy
  if (profile.tax_trial_started_at) {
    return NextResponse.json({ error: 'Trial đang chạy hoặc đã hết' }, { status: 400 })
  }

  // Kiểm tra quota
  const used = profile.tax_trial_count ?? 0
  const max = profile.tax_trial_max_count ?? 1
  if (used >= max) {
    return NextResponse.json({ error: 'Bạn đã dùng hết lượt thử miễn phí' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('profiles')
    .update({
      tax_trial_started_at: now,
      tax_trial_count: used + 1,
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, started_at: now })
}
