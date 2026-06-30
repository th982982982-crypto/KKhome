'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { AuthShell } from '@/components/auth/auth-shell'
import { toast } from 'sonner'
import { Loader2, MailCheck, AlertCircle } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const pendingEmail = searchParams.get('pending')
  const prefillEmail = searchParams.get('email')
  const errorMsg = searchParams.get('error')

  const [email, setEmail] = useState(pendingEmail ?? prefillEmail ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'Email hoặc mật khẩu không đúng'
        : error.message === 'Email not confirmed'
          ? 'Email chưa được xác nhận — vui lòng kiểm tra hộp thư'
          : error.message
      toast.error(msg)
      setLoading(false)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {pendingEmail && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm">
          <MailCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-emerald-900 dark:text-emerald-200">
            <p className="font-semibold mb-0.5">Kiểm tra email của bạn</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Chúng tôi đã gửi link xác nhận đến <span className="font-semibold">{pendingEmail}</span>. Bấm link để kích hoạt rồi quay lại đăng nhập.</p>
          </div>
        </div>
      )}
      {errorMsg && !pendingEmail && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-900 dark:text-red-200">{errorMsg === 'missing-code' ? 'Link xác nhận không hợp lệ. Vui lòng đăng ký lại.' : errorMsg}</p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput id="password" placeholder="••••••••" value={password} onChange={setPassword} required />
      </div>
      <Button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl font-semibold" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để truy cập templates đã mua"
      panelTitle={'Templates Google Sheets\nchuyên nghiệp.'}
      panelSubtitle="Khám phá kho templates được thiết kế dành riêng cho doanh nghiệp Việt — chấm công, kế toán, kho hàng và nhiều hơn nữa."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-gray-900 dark:text-gray-50 font-semibold hover:underline">Đăng ký miễn phí</Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
