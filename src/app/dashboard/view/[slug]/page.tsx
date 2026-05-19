import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { userCanViewTemplate } from '@/lib/access-control'
import { Navbar } from '@/components/layout/navbar'
import { getYouTubeEmbedUrl } from '@/lib/format'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default async function ViewTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/dashboard/view/${slug}`)

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!template) notFound()

  const canView = await userCanViewTemplate(user.id, template.id)

  if (!canView) {
    redirect('/dashboard?error=no-access')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const videoUrl = template.tutorial_video_url ? getYouTubeEmbedUrl(template.tutorial_video_url) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} isAdmin={profile?.is_admin} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium truncate">{template.name}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h1 className="font-bold text-gray-900 text-lg">{template.name}</h1>
            {template.google_sheet_copy_url && (
              <a
                href={template.google_sheet_copy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                Mở trong Google Sheets
              </a>
            )}
          </div>

          {template.google_sheet_embed_url ? (
            <iframe
              src={template.google_sheet_embed_url}
              className="w-full border-0"
              style={{ height: '80vh', minHeight: '500px' }}
              title={template.name}
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-3">📊</p>
                <p>Link embed chưa được cấu hình cho template này.</p>
              </div>
            </div>
          )}
        </div>

        {videoUrl && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Video hướng dẫn sử dụng</h2>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-w-3xl">
              <iframe
                src={videoUrl}
                className="w-full h-full"
                title="Hướng dẫn sử dụng"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
