import Link from 'next/link'
import { ReactNode } from 'react'
import { Sparkles, Shield, Zap, PlayCircle } from 'lucide-react'

interface AuthShellProps {
  title: string
  subtitle: string
  panelTitle: string
  panelSubtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, panelTitle, panelSubtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-4 py-12 lg:py-0 bg-white">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-gray-900 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">KK</div>
            KKhome
          </Link>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
          <p className="text-gray-500 mt-1.5 mb-8 text-sm">{subtitle}</p>

          {children}

          <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>
        </div>
      </div>

      {/* Right: gradient panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />

        <div className="relative flex flex-col justify-center px-12 xl:px-20 max-w-xl">
          <div className="inline-flex w-fit items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-full px-3 py-1 text-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white/80">Marketplace templates Việt Nam</span>
          </div>

          <h2 className="text-4xl font-black leading-tight tracking-tight mb-4">
            {panelTitle.split('\n').map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h2>
          <p className="text-white/70 mb-10 text-base leading-relaxed">{panelSubtitle}</p>

          <div className="space-y-4">
            {[
              { icon: <Zap className="w-4 h-4" />, title: 'Truy cập tức thì', desc: 'Xem templates ngay trên web, không cần tải' },
              { icon: <PlayCircle className="w-4 h-4" />, title: 'Video hướng dẫn', desc: 'Mỗi template có video chi tiết từng bước' },
              { icon: <Shield className="w-4 h-4" />, title: 'Cập nhật miễn phí', desc: 'Mua một lần, dùng mãi mãi với cập nhật' },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-white/10 backdrop-blur ring-1 ring-white/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
