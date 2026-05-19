import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { TemplateSection } from '@/components/templates/template-section'
import { ArrowRight, Star, Shield, Zap } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: featuredTemplates } = await supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      {/* Hero */}
      <section className="relative bg-black text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>Google Sheets Templates chuyên nghiệp</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Template Google Sheets<br />
            <span className="text-gray-400">cho mọi nhu cầu doanh nghiệp</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Chấm công, tính lương, quản lý nội dung, pháp luật doanh nghiệp — tất cả đã có sẵn,
            thiết kế đẹp và có video hướng dẫn cụ thể.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/templates">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 h-12 px-8 rounded-xl font-semibold">
                Xem tất cả templates <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/packages">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 rounded-xl font-semibold">
                Xem gói mua
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="w-5 h-5" />, title: 'Dùng ngay tức thì', desc: 'Xem template ngay trên web sau khi mua, không cần tải hay cài đặt.' },
            { icon: <Star className="w-5 h-5" />, title: 'Video hướng dẫn cụ thể', desc: 'Mỗi template có video hướng dẫn chi tiết từng bước sử dụng.' },
            { icon: <Shield className="w-5 h-5" />, title: 'Cập nhật miễn phí', desc: 'Mua một lần, nhận cập nhật mãi mãi khi pháp luật thay đổi.' },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Templates */}
      {featuredTemplates && featuredTemplates.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Templates nổi bật</h2>
              <Link href="/templates">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <TemplateSection templates={featuredTemplates} />
          </div>
        </section>
      )}

      {/* Packages CTA */}
      {packages && packages.length > 0 && (
        <section className="py-16 px-4 bg-black text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Tiết kiệm hơn với gói mua</h2>
            <p className="text-gray-400 mb-8">Mua theo gói để truy cập nhiều templates hơn với giá tốt hơn.</p>
            <Link href="/packages">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 h-12 px-8 rounded-xl font-semibold">
                Xem các gói <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      <footer className="py-8 px-4 border-t text-center text-sm text-gray-400">
        <p>© 2025 Template Store. Mọi quyền được bảo lưu.</p>
      </footer>
    </div>
  )
}
