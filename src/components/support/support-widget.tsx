'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Paperclip, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createClient } from '@/lib/supabase/client'

interface SupportMessageItem {
  id: string
  sender: 'customer' | 'admin'
  content: string
  attachment_url: string | null
  created_at: string
}

interface ContactInfo {
  name: string
  email: string
  phone: string
}

const VISITOR_ID_KEY = 'support_visitor_id'
const CONTACT_INFO_KEY = 'support_contact_info'
const OPEN_POLL_MS = 4000
const CLOSED_POLL_MS = 20000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(0|\+84)\d{9,10}$/

function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function SupportWidget({ zaloUrl }: { zaloUrl: string | null }) {
  const pathname = usePathname()
  const [visitorId, setVisitorId] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessageItem[]>([])
  const [unread, setUnread] = useState(false)
  const [adminLastReadAt, setAdminLastReadAt] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [contactChecked, setContactChecked] = useState(false)
  const [contactForm, setContactForm] = useState<ContactInfo>({ name: '', email: '', phone: '' })
  const [submittingContact, setSubmittingContact] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId())
    const stored = localStorage.getItem(CONTACT_INFO_KEY)
    if (stored) {
      try {
        setContactInfo(JSON.parse(stored))
      } catch {
        localStorage.removeItem(CONTACT_INFO_KEY)
      }
    }
    setContactChecked(true)
  }, [])

  useEffect(() => {
    async function prefill() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
      setContactForm((f) => ({
        name: f.name || profile?.full_name || '',
        email: f.email || user.email || '',
        phone: f.phone || profile?.phone || '',
      }))
    }
    prefill()
  }, [])

  const fetchMessages = useCallback(async (markRead: boolean) => {
    if (!visitorId) return
    try {
      const res = await fetch(`/api/support/messages?visitorId=${visitorId}${markRead ? '&markRead=1' : ''}`)
      const data = await res.json()
      setMessages(data.messages ?? [])
      setUnread(!!data.unread)
      setAdminLastReadAt(data.adminLastReadAt ?? null)
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

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = contactForm.name.trim()
    const email = contactForm.email.trim()
    const phone = contactForm.phone.trim()
    if (!name) { toast.error('Vui lòng nhập họ tên'); return }
    if (!EMAIL_RE.test(email)) { toast.error('Email không hợp lệ'); return }
    if (!PHONE_RE.test(phone)) { toast.error('Số điện thoại không hợp lệ'); return }

    setSubmittingContact(true)
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Không gửi được thông tin, thử lại')
        return
      }
      const info = { name, email, phone }
      localStorage.setItem(CONTACT_INFO_KEY, JSON.stringify(info))
      setContactInfo(info)
    } catch {
      toast.error('Lỗi kết nối, thử lại')
    } finally {
      setSubmittingContact(false)
    }
  }

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

  async function sendMessage() {
    const content = input.trim()
    if ((!content && !attachmentUrl) || sending || !visitorId) return
    setSending(true)
    setInput('')
    const pendingAttachment = attachmentUrl
    setAttachmentUrl(null)
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, content, attachmentUrl: pendingAttachment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gửi thất bại')
        setInput(content)
        setAttachmentUrl(pendingAttachment)
        return
      }
      setMessages((prev) => [...prev, data.message, ...(data.autoReplyMessage ? [data.autoReplyMessage] : [])])
    } catch {
      toast.error('Gửi thất bại, kiểm tra kết nối mạng')
      setInput(content)
      setAttachmentUrl(pendingAttachment)
    } finally {
      setSending(false)
    }
  }

  const lastCustomerMessageId = [...messages].reverse().find((m) => m.sender === 'customer')?.id ?? null
  const showContactGate = contactChecked && !contactInfo

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

          {showContactGate ? (
            <form onSubmit={handleContactSubmit} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vui lòng để lại thông tin để đội ngũ hỗ trợ liên hệ lại nhanh nhất nhé!
              </p>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Họ và tên"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              />
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email (gmail)"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              />
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Số điện thoại Zalo"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              />
              <button
                type="submit"
                disabled={submittingContact}
                className="mt-1 w-full h-10 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submittingContact && <Loader2 className="w-4 h-4 animate-spin" />}
                Bắt đầu chat
              </button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {messages.length === 0 && (
                  <div className="mr-auto max-w-[75%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    Chào bạn! Đội ngũ hỗ trợ luôn sẵn sàng, để lại tin nhắn nhé.
                  </div>
                )}
                {messages.map((m) => {
                  const seen = m.sender === 'customer' && m.id === lastCustomerMessageId &&
                    !!adminLastReadAt && adminLastReadAt >= m.created_at
                  return (
                    <div key={m.id} className={cn('flex flex-col max-w-[75%]', m.sender === 'customer' ? 'ml-auto items-end' : 'mr-auto items-start')}>
                      <div
                        className={cn(
                          'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                          m.sender === 'customer'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                        )}
                      >
                        {m.attachment_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.attachment_url} alt="Ảnh đính kèm" className="rounded-lg max-w-full max-h-48 mb-1" />
                        )}
                        {m.content && m.content}
                      </div>
                      <div className="text-[10px] mt-0.5 text-gray-400 dark:text-gray-500 px-1">
                        {formatTime(m.created_at)}{seen && ' · Đã xem'}
                      </div>
                    </div>
                  )
                })}
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
                onSubmit={(e) => { e.preventDefault(); sendMessage() }}
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  onPaste={handlePaste}
                  disabled={sending}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && !attachmentUrl) || sending}
                  className="w-9 h-9 shrink-0 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center disabled:opacity-40"
                  aria-label="Gửi"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
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
