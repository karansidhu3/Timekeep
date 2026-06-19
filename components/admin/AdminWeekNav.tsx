'use client'

import { useRouter } from 'next/navigation'

export default function AdminWeekNav({ weekOffset }: { weekOffset: number }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`/admin/schedule?week=${weekOffset - 1}&dir=prev`)}
        className="w-11 h-11 flex items-center justify-center rounded-xl text-label-2
          bg-[#e6dfd0] hover:bg-[#ddd4be] active:bg-[#cdbfa0] transition-colors duration-150"
        aria-label="Previous week"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {weekOffset !== 0 && (
        <button
          onClick={() => router.push(`/admin/schedule?dir=${weekOffset > 0 ? 'prev' : 'next'}`)}
          className="px-3 h-11 text-xs font-medium text-label-2 bg-[#f0ebe1] hover:bg-[#eae3d3]
            active:bg-[#ddd4be] rounded-xl transition-colors duration-150 tracking-[-0.01em]"
        >
          This week
        </button>
      )}

      <button
        onClick={() => router.push(`/admin/schedule?week=${weekOffset + 1}&dir=next`)}
        className="w-11 h-11 flex items-center justify-center rounded-xl text-label-2
          bg-[#e6dfd0] hover:bg-[#ddd4be] active:bg-[#cdbfa0] transition-colors duration-150"
        aria-label="Next week"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
