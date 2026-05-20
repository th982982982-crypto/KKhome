'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calcTimeLeft(endAt: string): TimeLeft {
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  }
}

function Seg({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-red-600 text-white font-black text-sm leading-none px-2 py-1 rounded-md min-w-[28px] text-center tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-red-500 dark:text-red-400 font-semibold mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  )
}

/** Compact segmented countdown for template cards */
export function CountdownCard({ endAt }: { endAt: string }) {
  const [t, setT] = useState<TimeLeft>(() => calcTimeLeft(endAt))

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(endAt)), 1000)
    return () => clearInterval(id)
  }, [endAt])

  if (t.expired) return null

  return (
    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-red-100 dark:border-red-900/40">
      <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide shrink-0">Kết thúc sau</span>
      <div className="flex items-center gap-1 ml-auto">
        {t.days > 0 && <Seg value={t.days} label="ngày" />}
        {t.days > 0 && <Seg value={t.hours} label="giờ" />}
        {t.days === 0 && (
          <>
            <Seg value={t.hours} label="giờ" />
            <Seg value={t.minutes} label="phút" />
            <Seg value={t.seconds} label="giây" />
          </>
        )}
      </div>
    </div>
  )
}

/** Larger segmented countdown for modal */
export function CountdownModal({ endAt }: { endAt: string }) {
  const [t, setT] = useState<TimeLeft>(() => calcTimeLeft(endAt))

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(endAt)), 1000)
    return () => clearInterval(id)
  }, [endAt])

  if (t.expired) return null

  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5 mb-4">
      <Flame className="w-4 h-4 text-red-500 shrink-0" />
      <span className="text-xs font-bold text-red-700 dark:text-red-300 shrink-0">Kết thúc sau</span>
      <div className="flex items-center gap-1.5 ml-auto">
        {t.days > 0 && (
          <>
            <SegLg value={t.days} label="Ngày" />
            <Colon />
          </>
        )}
        <SegLg value={t.hours} label="Giờ" />
        <Colon />
        <SegLg value={t.minutes} label="Phút" />
        <Colon />
        <SegLg value={t.seconds} label="Giây" />
      </div>
    </div>
  )
}

function SegLg({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-red-600 text-white font-black text-base leading-none px-2.5 py-1.5 rounded-lg min-w-[36px] text-center tabular-nums shadow-sm">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-red-500 dark:text-red-400 font-semibold mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  )
}

function Colon() {
  return <span className="text-red-500 font-black text-base pb-3 leading-none">:</span>
}

/** Legacy inline version (kept for backward compat) */
export function CountdownTimer({ endAt, className = '' }: { endAt: string; className?: string }) {
  return <CountdownCard endAt={endAt} />
}
