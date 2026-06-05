'use client'

import { useRouter } from 'next/navigation'

export default function WeekNav({ weekOffset }: { weekOffset: number }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`/schedule?week=${weekOffset - 1}`)}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors"
        aria-label="Previous week"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {weekOffset !== 0 && (
        <button
          onClick={() => router.push('/schedule')}
          className="px-2.5 h-10 text-xs font-semibold text-stone-500 hover:bg-stone-100 active:bg-stone-200 rounded-xl transition-colors"
        >
          Today
        </button>
      )}

      <button
        onClick={() => router.push(`/schedule?week=${weekOffset + 1}`)}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors"
        aria-label="Next week"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
