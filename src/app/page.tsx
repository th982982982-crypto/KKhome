import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { SiteFooter } from '@/components/layout/site-footer'
import { TemplateSection } from '@/components/templates/template-section'
import { getUserPurchasedTemplateIds } from '@/lib/access-control'
import { ArrowRight, Sparkles, Shield, Zap, PlayCircle, Star } from 'lucide-react'
import type { PromotionWithTemplates } from '@/lib/supabase/types'
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let purchasedIds: string[] = []
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
    purchasedIds = await getUserPurchasedTemplateIds(user.id)
  }

  const now = new Date().toISOString()
  const [
    { data: templatesData },
    { data: packagesData },
    { count: templateCount },
    { data: promoData },
  ] = await Promise.all([
    admin.from('templates').select('*').eq('is_published', true).order('sort_order', { ascending: true }).limit(8),
    admin.from('packages').select('*').eq('is_active', true).order('sort_order', { ascending: true }).limit(3),
    admin.from('templates').select('*', { count: 'exact', head: true }).eq('is_published', true),
    admin.from('promotions').select('*, promotion_templates(template_id)').eq('is_active', true).lte('start_at', now).gte('end_at', now),
  ])

  const featuredTemplates = templatesData ?? []
  const packages = packagesData ?? []

  const activePromotions: PromotionWithTemplates[] = (promoData ?? []).map((p) => ({
    ...p,
    template_ids: (p.promotion_templates ?? []).map((pt: { template_id: string }) => pt.template_id),
    promotion_templates: undefined,
  }))

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar user={user} isAdmin={profile?.is_admin} canViewLegal={profile?.is_admin || !!user?.user_metadata?.can_view_legal} />

      <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(236,72,153,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur ring-1 ring-white/10 rounded-full px-4 py-1.5 text-xs sm:text-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-white/80">Google Sheets Templates chuyên nghiệp cho doanh nghiệp Việt</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-6">
            Mua template,<br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              dùng ngay lập tức.
            </span>
          </h1>

          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Chấm công, tính lương, quản lý kho, pháp luật doanh nghiệp — mỗi template
            đều có video hướng dẫn chi tiết và xem trực tiếp trên web sau khi mua.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/templates">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl font-semibold shadow-2xl shadow-white/10">
                Khám phá templates <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/packages">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/15 border border-white/20 backdrop-blur h-12 px-8 rounded-xl font-semibold">
                <PlayCircle className="w-4 h-4 mr-2" /> Xem gói mua
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { n: `${templateCount ?? '20'}+`, l: 'Templates' },
              { n: '500+', l: 'Khách hàng' },
              { n: '4.9★', l: 'Đánh giá' },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{s.n}</div>
                <div className="text-xs text-white/50 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Zap className="w-5 h-5" />, title: 'Dùng ngay tức thì', desc: 'Xem template ngay trên web sau khi mua, không cần tải hay cài đặt.', color: 'from-amber-100 to-orange-50' },
            { icon: <PlayCircle className="w-5 h-5" />, title: 'Video hướng dẫn chi tiết', desc: 'Mỗi template có video hướng dẫn từng bước sử dụng.', color: 'from-violet-100 to-indigo-50' },
            { icon: <Shield className="w-5 h-5" />, title: 'Cập nhật miễn phí', desc: 'Mua một lần, nhận cập nhật mãi mãi khi pháp luật thay đổi.', color: 'from-emerald-100 to-teal-50' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900/40 p-6 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md dark:hover:shadow-black/40 transition-all">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 text-gray-900`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-50 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Templates */}
      {featuredTemplates.length > 0 && (
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Templates nổi bật</div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Phổ biến nhất tuần này</h2>
              </div>
              <Link href="/templates" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                  Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <TemplateSection templates={featuredTemplates} purchasedIds={purchasedIds} activePromotions={activePromotions} />
            <div className="text-center mt-8 sm:hidden">
              <Link href="/templates">
                <Button variant="outline">Xem tất cả templates <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Packages CTA */}
      {packages.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-slate-950 to-indigo-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs mb-4">
              <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Tiết kiệm tới 40%</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">Mua theo gói, tiết kiệm hơn</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">Gói bundle gồm nhiều templates cùng lĩnh vực — giá tốt hơn mua lẻ, dùng ngay không giới hạn.</p>
            <Link href="/packages">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 h-12 px-8 rounded-xl font-semibold">
                Xem các gói mua <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      )}
      </main>

      <SiteFooter />
    </div>
  )
}
