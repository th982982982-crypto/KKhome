'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { AuthShell } from '@/components/auth/auth-shell'
import { toast } from 'sonner'
import { Loader2, MailCheck, ExternalLink, RotateCw } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      const lower = error.message.toLowerCase()
      const isDup = lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already')
      toast.error(isDup ? 'Email này đã được đăng ký. Hãy đăng nhập.' : error.message)
      if (isDup) router.push(`/login?email=${encodeURIComponent(email)}`)
      setLoading(false)
    } else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error('Email này đã được đăng ký. Hãy đăng nhập.')
      router.push(`/login?email=${encodeURIComponent(email)}`)
      setLoading(false)
    } else if (data.user && !data.session) {
      setSubmittedEmail(email)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleResend() {
    if (!submittedEmail) return
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: submittedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (error) toast.error(error.message)
    else toast.success('Đã gửi lại email xác nhận')
    setResending(false)
  }

  if (submittedEmail) {
    const emailDomain = submittedEmail.split('@')[1]?.toLowerCase() ?? ''
    const mailHref =
      emailDomain.includes('gmail') ? 'https://mail.google.com' :
      emailDomain.includes('outlook') || emailDomain.includes('hotmail') || emailDomain.includes('live') ? 'https://outlook.live.com/mail' :
      emailDomain.includes('yahoo') ? 'https://mail.yahoo.com' :
      `https://${emailDomain}`

    return (
      <AuthShell
        title="Còn 1 bước nữa thôi"
        subtitle="Xác nhận email để kích hoạt tài khoản"
        panelTitle={'An toàn và\nbảo mật.'}
        panelSubtitle="Chúng tôi cần xác nhận bạn là chủ sở hữu của địa chỉ email này trước khi mở quyền truy cập templates."
        footer={
          <>
            Sai email?{' '}
            <button
              onClick={() => setSubmittedEmail(null)}
              className="text-gray-900 font-semibold hover:underline"
            >
              Đăng ký lại
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center ring-1 ring-emerald-200">
              <MailCheck className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Đã gửi link xác nhận đến</p>
            <p className="font-bold text-gray-900 text-base break-all">{submittedEmail}</p>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">3 bước đơn giản</p>
            <ol className="space-y-2.5 text-sm text-gray-700">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Mở hộp thư email vừa nhập</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Bấm vào nút <span className="font-semibold">"Xác nhận tài khoản"</span> trong email</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                <span><span className="font-semibold text-emerald-700">Tự động đăng nhập</span> và vào dashboard ngay</span>
              </li>
            </ol>
          </div>

          <a
            href={mailHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-xl bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Mở hộp thư
          </a>

          <div className="text-center text-xs text-gray-500">
            Chưa nhận được email? Kiểm tra thư mục spam hoặc{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-gray-900 font-semibold hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
              gửi lại
            </button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Đăng ký trong 30 giây để mua templates"
      panelTitle={'Tham gia 500+\nkhách hàng tin dùng.'}
      panelSubtitle="Tạo tài khoản miễn phí, mua template một lần và dùng mãi mãi với cập nhật khi pháp luật thay đổi."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-gray-900 font-semibold hover:underline">Đăng nhập</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <PasswordInput id="password" placeholder="Ít nhất 6 ký tự" value={password} onChange={setPassword} required />
        </div>
        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 h-11 rounded-xl font-semibold" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng ký...</> : 'Tạo tài khoản'}
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng của chúng tôi.
        </p>
      </form>
    </AuthShell>
  )
}
