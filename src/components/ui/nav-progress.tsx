'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const prevKey = useRef(`${pathname}?${searchParams}`)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (anchor.target === '_blank') return
      setVisible(true)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const key = `${pathname}?${searchParams}`
    if (key !== prevKey.current) {
      prevKey.current = key
      setVisible(false)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden pointer-events-none">
      <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent" />
      <div
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        style={{ animation: 'nav-progress 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
      />
    </div>
  )
}
