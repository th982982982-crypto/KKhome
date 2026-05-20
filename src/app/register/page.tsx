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
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
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
      options: { data: { full_name: fullName } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else if (data.user && !data.session) {
      toast.success('Kiểm tra email để xác nhận tài khoản!')
      router.push('/login')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
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
