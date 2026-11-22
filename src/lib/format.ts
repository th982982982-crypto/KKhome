export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateOrderCode(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `DH${y}${m}${d}${rand}`
}

/** Cộng thêm `months` tháng theo lịch (giữ nguyên ngày/giờ). */
export function addMonths(date: Date, months: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  )
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

export function stripHtml(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function markdownToHtml(text?: string | null): string {
  if (!text) return ''

  // If already standard HTML without markdown syntax
  if (/<[a-z][\s\S]*>/i.test(text) && !text.includes('##') && !text.includes('**')) {
    return text
  }

  let html = text
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-xs my-3"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono border border-indigo-200 dark:border-indigo-800">$1</code>')
    .replace(/^#### (.*$)/gim, '<h5 class="text-sm font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">$1</h5>')
    .replace(/^### (.*$)/gim, '<h4 class="text-base font-bold text-indigo-700 dark:text-indigo-300 mt-5 mb-2">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="text-lg font-black text-gray-900 dark:text-gray-50 mt-6 mb-3 pb-1 border-b border-gray-100 dark:border-gray-800">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="text-xl font-black text-gray-900 dark:text-gray-50 mt-6 mb-3">$1</h2>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 italic my-3 text-gray-700 dark:text-gray-300 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-lg">$1</blockquote>')
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li class="flex items-start gap-2 my-1.5 text-gray-700 dark:text-gray-300"><span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span><span>$1</span></li>')
    .replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li class="flex items-start gap-2 my-1.5 text-gray-700 dark:text-gray-300"><span class="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">$1.</span><span>$2</span></li>')

  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, '<ul class="my-3 space-y-1 pl-1">$0</ul>')

  const blocks = html.split('\n\n')
  return blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[1-6]|ul|ol|pre|blockquote|div|p)/i.test(trimmed)) {
        return trimmed
      }
      return `<p class="my-2.5 text-gray-700 dark:text-gray-300 leading-relaxed">${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}
