import { randomInt } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateTempPassword() {
  return String(randomInt(0, 100000000)).padStart(8, '0')
}

const COOLDOWN_MS = 60 * 1000

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authUser = usersPage?.users.find((u) => u.email === email)

  // Không tiết lộ email có tồn tại trong hệ thống hay không
  if (!authUser) {
    return NextResponse.json({ success: true })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('password_reset_requested_at')
    .eq('id', authUser.id)
    .single()

  if (profile?.password_reset_requested_at) {
    const elapsed = Date.now() - new Date(profile.password_reset_requested_at).getTime()
    if (elapsed < COOLDOWN_MS) {
      return NextResponse.json({ success: true })
    }
  }

  const tempPassword = generateTempPassword()

  const scriptUrl = process.env.GOOGLE_SCRIPT_RESET_PASSWORD_URL
  const scriptSecret = process.env.GOOGLE_SCRIPT_SHARED_SECRET

  if (!scriptUrl || !scriptSecret) {
    return NextResponse.json({ error: 'Chưa cấu hình dịch vụ gửi email' }, { status: 500 })
  }

  try {
    const scriptRes = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: scriptSecret, to: email, tempPassword }),
    })
    const scriptData = await scriptRes.json()
    if (!scriptData?.ok) {
      return NextResponse.json({ error: 'Không thể gửi email lúc này, vui lòng thử lại sau' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: 'Không thể gửi email lúc này, vui lòng thử lại sau' }, { status: 502 })
  }

  const { error: updatePwError } = await admin.auth.admin.updateUserById(authUser.id, {
    password: tempPassword,
  })
  if (updatePwError) {
    return NextResponse.json({ error: updatePwError.message }, { status: 500 })
  }

  await admin
    .from('profiles')
    .update({ must_change_password: true, password_reset_requested_at: new Date().toISOString() })
    .eq('id', authUser.id)

  return NextResponse.json({ success: true })
}
