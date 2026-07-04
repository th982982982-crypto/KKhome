'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/auth-shell'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra, vui lòng thử lại sau')
        return
      }
      // Always show success (không tiết lộ email có tồn tại hay không)
      setSent(true)
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận mật khẩu tạm thời"
      panelTitle={'Khôi phục\ntài khoản của bạn.'}
      panelSubtitle="Chúng tôi sẽ gửi một mật khẩu tạm thời vào email của bạn để đăng nhập lại."
      footer={
        <Link href="/login" className="flex items-center gap-1 text-gray-900 dark:text-gray-50 font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-50 mb-1">Kiểm tra hộp thư</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nếu <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span> tồn tại trong hệ thống, bạn sẽ nhận được email chứa mật khẩu tạm thời để đăng nhập.
            </p>
            <p className="text-xs text-gray-400 mt-2">Sau khi đăng nhập bằng mật khẩu tạm, bạn sẽ được yêu cầu đặt mật khẩu mới. Kiểm tra cả thư mục Spam nếu không thấy.</p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="mt-2">Quay lại đăng nhập</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email tài khoản</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-11 rounded-xl font-semibold"
            disabled={loading}
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</> : 'Gửi mật khẩu tạm thời'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
