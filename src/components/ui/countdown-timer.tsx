'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export function CountdownTimer({ endAt, className = '' }: { endAt: string; className?: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function calc() {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Đã kết thúc'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h >= 24) {
        const d = Math.floor(h / 24)
        setTimeLeft(`${d}n ${h % 24}h`)
      } else {
        setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      }
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endAt])

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  )
}
