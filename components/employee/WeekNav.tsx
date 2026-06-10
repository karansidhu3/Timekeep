'use client'

import { useRouter } from 'next/navigation'

export default function WeekNav({ weekOffset }: { weekOffset: number }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`/schedule?week=${weekOffset - 1}`)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#a8a29e]
          hover:bg-[#f0ede8] active:bg-[#e8e4de] transition-colors duration-150"
        aria-label="Previous week"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {weekOffset !== 0 && (
        <button
          onClick={() => router.push('/schedule')}
          className="px-3 h-9 text-xs font-medium text-[#44403c] hover:bg-[#f0ede8]
            active:bg-[#e8e4de] rounded-xl transition-colors duration-150 tracking-[-0.01em]"
        >
          This week
        </button>
      )}

      <button
        onClick={() => router.push(`/schedule?week=${weekOffset + 1}`)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#a8a29e]
          hover:bg-[#f0ede8] active:bg-[#e8e4de] transition-colors duration-150"
        aria-label="Next week"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
