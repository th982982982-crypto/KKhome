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
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : error.message)
      setLoading(false)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput id="password" placeholder="••••••••" value={password} onChange={setPassword} required />
      </div>
      <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 h-11 rounded-xl font-semibold" disabled={loading}>
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
          <Link href="/register" className="text-gray-900 font-semibold hover:underline">Đăng ký miễn phí</Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-gray-400 text-sm">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
