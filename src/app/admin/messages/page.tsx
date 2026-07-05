import { createAdminClient } from '@/lib/supabase/server'
import { AdminMessagesPanel } from '@/components/admin/admin-messages-panel'
import { MessageCircle } from 'lucide-react'

export const revalidate = 0

export default async function AdminMessagesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('support_conversations')
    .select('id, visitor_id, user_id, last_message_at, last_customer_message_at, last_admin_message_at, admin_last_read_at, guest_name, guest_email, guest_phone, profiles(full_name)')
    .order('last_message_at', { ascending: false })

  const conversations = (data ?? []).map((c) => ({
    ...c,
    profiles: Array.isArray(c.profiles) ? c.profiles[0] ?? null : c.profiles,
    unread: !!c.last_customer_message_at &&
      (!c.admin_last_read_at || c.last_customer_message_at > c.admin_last_read_at),
  }))

  const unreadCount = conversations.filter((c) => c.unread).length

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-1.5">
          <MessageCircle className="w-4 h-4" />
          <span>Tin nhắn hỗ trợ</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Tin nhắn hỗ trợ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{conversations.length}</span> hội thoại •{' '}
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{unreadCount}</span> chưa đọc
        </p>
      </div>

      <AdminMessagesPanel initialConversations={conversations} />
    </div>
  )
}
