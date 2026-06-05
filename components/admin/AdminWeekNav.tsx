'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function AdminWeekNav({ weekOffset }: { weekOffset: number }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="sm" onClick={() => router.push(`/admin/schedule?week=${weekOffset - 1}`)}>
        ‹ Prev
      </Button>
      {weekOffset !== 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/schedule')}>
          This week
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={() => router.push(`/admin/schedule?week=${weekOffset + 1}`)}>
        Next ›
      </Button>
    </div>
  )
}
