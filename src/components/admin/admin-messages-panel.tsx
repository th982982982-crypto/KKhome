'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Send, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  visitor_id: string
  user_id: string | null
  last_message_at: string
  last_customer_message_at: string | null
  last_admin_message_at: string | null
  admin_last_read_at: string | null
  profiles?: { full_name: string | null } | null
  unread: boolean
}

interface MessageItem {
  id: string
  sender: 'customer' | 'admin'
  content: string
  created_at: string
}

const LIST_POLL_MS = 7000
const THREAD_POLL_MS = 6000

function displayName(c: Conversation) {
  return c.profiles?.full_name || 'Khách vãng lai'
}

export function AdminMessagesPanel({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations ?? [])
    } catch {
      // bỏ qua lỗi polling, thử lại ở lượt sau
    }
  }, [])

  const fetchThread = useCallback(async (id: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/support/${id}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshList, LIST_POLL_MS)
    return () => clearInterval(interval)
  }, [refreshList])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    fetchThread(selectedId)
    const interval = setInterval(() => fetchThread(selectedId), THREAD_POLL_MS)
    return () => clearInterval(interval)
  }, [selectedId, fetchThread])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (selectedId) {
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unread: false } : c)))
    }
  }, [selectedId])

  async function handleReply() {
    const content = reply.trim()
    if (!content || sending || !selectedId) return
    setSending(true)
    setReply('')
    try {
      const res = await fetch(`/api/admin/support/${selectedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gửi thất bại')
        return
      }
      setMessages((prev) => [...prev, data.message])
      refreshList()
    } finally {
      setSending(false)
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex gap-5 items-start h-[calc(100vh-260px)] min-h-[480px]">
      {/* Conversation list */}
      <div className="w-72 shrink-0 h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 p-4 text-center">Chưa có hội thoại nào.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={cn(
              'w-full flex items-start gap-2.5 px-3 py-3 text-left border-b border-gray-50 dark:border-gray-800/60 transition-colors',
              selectedId === c.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">{displayName(c)}</span>
                {c.unread && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
              </div>
              <p className={cn('text-xs truncate mt-0.5', selectedId === c.id ? 'opacity-70' : 'text-gray-400 dark:text-gray-500')}>
                {new Date(c.last_message_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="flex-1 min-w-0 h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Chọn một hội thoại để xem
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="font-bold text-gray-900 dark:text-gray-50">{displayName(selected)}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visitor ID: {selected.visitor_id}</p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                      m.sender === 'admin'
                        ? 'ml-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-sm'
                        : 'mr-auto bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                    )}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleReply() }}
              className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 shrink-0"
            >
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply()
                  }
                }}
                placeholder="Nhập phản hồi..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="w-9 h-9 shrink-0 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center disabled:opacity-40"
                aria-label="Gửi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
