'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function WeekNav({ weekOffset }: { weekOffset: number }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/schedule?week=${weekOffset - 1}`)}
      >
        ‹
      </Button>
      {weekOffset !== 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/schedule')}
        >
          Today
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/schedule?week=${weekOffset + 1}`)}
      >
        ›
      </Button>
    </div>
  )
}
