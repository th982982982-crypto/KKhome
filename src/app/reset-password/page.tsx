'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { AuthShell } from '@/components/auth/auth-shell'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const updatePassword = (v: string) => setPassword(v)
  const updateConfirm = (v: string) => setConfirm(v)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase gửi token qua URL hash: #access_token=...&type=recovery
    // createClient().auth.onAuthStateChange bắt event SIGNED_IN sau khi Supabase tự xử lý hash
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })
    // Nếu sau 5s vẫn chưa có session → link hết hạn hoặc sai
    const timer = setTimeout(() => {
      if (!sessionReady) setSessionError(true)
    }, 5000)
    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (password !== confirm) { toast.error('Mật khẩu xác nhận không khớp'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
      panelTitle={'Bảo mật\ntài khoản của bạn.'}
      panelSubtitle="Chọn mật khẩu mạnh, ít nhất 6 ký tự. Không dùng lại mật khẩu cũ."
      footer={
        <Link href="/login" className="text-gray-900 dark:text-gray-50 font-semibold hover:underline">
          Quay lại đăng nhập
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-50 mb-1">Đặt lại mật khẩu thành công!</p>
            <p className="text-sm text-gray-500">Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        </div>
      ) : sessionError ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-50 mb-1">Link đã hết hạn hoặc không hợp lệ</p>
            <p className="text-sm text-gray-500 mb-4">Vui lòng yêu cầu gửi lại link đặt lại mật khẩu.</p>
          </div>
          <Link href="/forgot-password">
            <Button className="bg-black dark:bg-white text-white dark:text-gray-900">Gửi lại link</Button>
          </Link>
        </div>
      ) : !sessionReady ? (
        <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực link...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <PasswordInput
              id="password"
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={updatePassword}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
            <PasswordInput
              id="confirm"
              placeholder="Nhập lại mật khẩu mới"
              value={confirm}
              onChange={updateConfirm}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang cập nhật...</> : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
