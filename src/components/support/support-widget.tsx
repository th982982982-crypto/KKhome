'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SupportMessageItem {
  id: string
  sender: 'customer' | 'admin'
  content: string
  created_at: string
}

const VISITOR_ID_KEY = 'support_visitor_id'
const OPEN_POLL_MS = 4000
const CLOSED_POLL_MS = 20000

function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

export function SupportWidget({ zaloUrl }: { zaloUrl: string | null }) {
  const pathname = usePathname()
  const [visitorId, setVisitorId] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessageItem[]>([])
  const [unread, setUnread] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId())
  }, [])

  const fetchMessages = useCallback(async (markRead: boolean) => {
    if (!visitorId) return
    try {
      const res = await fetch(`/api/support/messages?visitorId=${visitorId}${markRead ? '&markRead=1' : ''}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
      setUnread(!!data.unread)
    } catch {
      // bỏ qua lỗi polling, thử lại ở lượt sau
    }
  }, [visitorId])

  useEffect(() => {
    if (!visitorId) return
    fetchMessages(isOpen)
    const interval = setInterval(() => fetchMessages(isOpen), isOpen ? OPEN_POLL_MS : CLOSED_POLL_MS)
    return () => clearInterval(interval)
  }, [visitorId, isOpen, fetchMessages])

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  if (pathname?.startsWith('/admin')) return null

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending || !visitorId) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, content }),
      })
      const data = await res.json()
      if (data.message) setMessages((prev) => [...prev, data.message])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[92vw] max-w-[360px] h-[70vh] max-h-[520px] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-50">Hỗ trợ khách hàng</span>
            <button onClick={() => setIsOpen(false)} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="mr-auto max-w-[75%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                Chào bạn! Đội ngũ hỗ trợ luôn sẵn sàng, để lại tin nhắn nhé.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                  m.sender === 'customer'
                    ? 'ml-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-sm'
                    : 'mr-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                )}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage() }}
            className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 shrink-0"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-9 h-9 shrink-0 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center disabled:opacity-40"
              aria-label="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col items-end gap-3">
        {zaloUrl && (
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat qua Zalo"
            className="w-12 h-12 rounded-full bg-[#0068FF] hover:bg-[#0055D4] text-white flex items-center justify-center shadow-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        )}
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
          className="relative w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && unread && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
          )}
        </button>
      </div>
    </div>
  )
}
