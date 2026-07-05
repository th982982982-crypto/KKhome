'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Send, MessageCircle, Loader2, Paperclip, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface Conversation {
  id: string
  visitor_id: string
  user_id: string | null
  last_message_at: string
  last_customer_message_at: string | null
  last_admin_message_at: string | null
  admin_last_read_at: string | null
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  profiles?: { full_name: string | null } | null
  unread: boolean
}

interface MessageItem {
  id: string
  sender: 'customer' | 'admin'
  content: string
  attachment_url: string | null
  created_at: string
}

const LIST_POLL_MS = 7000
const THREAD_POLL_MS = 6000

function displayName(c: Conversation) {
  return c.guest_name || c.profiles?.full_name || 'Khách vãng lai'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function AdminMessagesPanel({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [customerLastReadAt, setCustomerLastReadAt] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setCustomerLastReadAt(data.conversation?.customer_last_read_at ?? null)
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

  async function handleAttachFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Chỉ hỗ trợ file ảnh'); return }
    setUploadingAttachment(true)
    try {
      const url = await uploadToCloudinary(file)
      setAttachmentUrl(url)
    } catch {
      toast.error('Upload ảnh thất bại, thử lại')
    } finally {
      setUploadingAttachment(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) handleAttachFile(file)
        break
      }
    }
  }

  async function handleReply() {
    const content = reply.trim()
    if ((!content && !attachmentUrl) || sending || !selectedId) return
    setSending(true)
    setReply('')
    const pendingAttachment = attachmentUrl
    setAttachmentUrl(null)
    try {
      const res = await fetch(`/api/admin/support/${selectedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachmentUrl: pendingAttachment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gửi thất bại')
        setReply(content)
        setAttachmentUrl(pendingAttachment)
        return
      }
      setMessages((prev) => [...prev, data.message])
      refreshList()
    } catch {
      toast.error('Gửi thất bại, kiểm tra kết nối mạng')
      setReply(content)
      setAttachmentUrl(pendingAttachment)
    } finally {
      setSending(false)
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const lastAdminMessageId = [...messages].reverse().find((m) => m.sender === 'admin')?.id ?? null

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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Visitor ID: {selected.visitor_id}
                {selected.guest_email && <> · {selected.guest_email}</>}
                {selected.guest_phone && <> · {selected.guest_phone}</>}
              </p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : (
                messages.map((m) => {
                  const seen = m.sender === 'admin' && m.id === lastAdminMessageId &&
                    !!customerLastReadAt && customerLastReadAt >= m.created_at
                  return (
                    <div key={m.id} className={cn('flex flex-col max-w-[70%]', m.sender === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start')}>
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                          m.sender === 'admin'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                        )}
                      >
                        {m.attachment_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.attachment_url} alt="Ảnh đính kèm" className="rounded-lg max-w-full max-h-56 mb-1" />
                        )}
                        {m.content && m.content}
                      </div>
                      <div className="text-[10px] mt-0.5 text-gray-400 dark:text-gray-500 px-1">
                        {formatTime(m.created_at)}{seen && ' · Đã xem'}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {attachmentUrl && (
              <div className="px-3 pt-2 shrink-0">
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachmentUrl} alt="Xem trước" className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    aria-label="Bỏ ảnh"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); handleReply() }}
              className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAttachFile(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploadingAttachment}
                className="w-9 h-9 shrink-0 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center disabled:opacity-40"
                aria-label="Đính kèm ảnh"
              >
                {uploadingAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply()
                  }
                }}
                onPaste={handlePaste}
                disabled={sending}
                placeholder="Nhập phản hồi..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={(!reply.trim() && !attachmentUrl) || sending}
                className="w-9 h-9 shrink-0 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center disabled:opacity-40"
                aria-label="Gửi"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
