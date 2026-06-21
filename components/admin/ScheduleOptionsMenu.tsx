'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addDays } from 'date-fns'
import { applyTemplatesToWeek } from '@/lib/actions/templates'

interface Template {
  employee_id: string
  day_of_week: number
  start_time: string
  end_time: string
  notes: string | null
}

interface Props {
  templates: Template[]
  weekStart: Date
}

export default function ScheduleOptionsMenu({ templates, weekStart }: Props) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function handleApply() {
    setOpen(false)
    setStatus(null)
    startTransition(async () => {
      const shifts = templates.map(t => {
        const shiftDay = addDays(weekStart, t.day_of_week % 7)
        const [startH, startM] = t.start_time.split(':').map(Number)
        const [endH, endM]     = t.end_time.split(':').map(Number)
        const start = new Date(shiftDay)
        start.setHours(startH, startM, 0, 0)
        const end = new Date(shiftDay)
        end.setHours(endH, endM, 0, 0)
        return {
          employeeId: t.employee_id,
          startTime:  start.toISOString(),
          endTime:    end.toISOString(),
          notes:      t.notes,
        }
      })
      const result = await applyTemplatesToWeek(shifts)
      if (result.success) {
        const msg = result.created === 0
          ? 'Already up to date'
          : `Added ${result.created} shift${result.created !== 1 ? 's' : ''}${result.skipped ? ` · ${result.skipped} skipped` : ''}`
        setStatus(msg)
        router.refresh()
        setTimeout(() => setStatus(null), 3500)
      }
    })
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Schedule options"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-150
          ${open ? 'bg-[#ddd4be]' : 'bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2]'}`}
      >
        {/* Three-dot ellipsis */}
        <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor" className="text-label-1">
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="8" cy="2" r="1.5" />
          <circle cx="14" cy="2" r="1.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-52 bg-[#f9f4ea] rounded-2xl border border-[#d3c9b2] overflow-hidden z-50 animate-fade-in"
          style={{ boxShadow: '0 8px 24px rgba(20,16,10,0.12), 0 2px 6px rgba(20,16,10,0.08)' }}
        >
          {templates.length > 0 ? (
            <button
              onClick={handleApply}
              disabled={isPending}
              className="w-full text-left px-4 py-3.5 text-sm font-medium text-label-1 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors tracking-[-0.01em] border-b border-[#d3c9b2] disabled:opacity-40"
            >
              {isPending ? 'Applying…' : 'Apply template'}
            </button>
          ) : (
            <div className="px-4 py-3.5 border-b border-[#d3c9b2]">
              <p className="text-sm text-label-1 font-medium tracking-[-0.01em]">Apply template</p>
              <p className="text-xs text-label-3 mt-0.5 tracking-[-0.01em]">No template saved yet</p>
            </div>
          )}
          <Link
            href="/admin/templates"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-3.5 text-sm font-medium text-label-1 hover:bg-[#f2ece2] active:bg-[#eae3d3] transition-colors tracking-[-0.01em]"
          >
            Manage templates
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-label-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Status toast */}
      {status && !open && (
        <div className="absolute right-0 top-12 bg-[#f9f4ea] border border-[#d3c9b2] rounded-xl px-3 py-2 whitespace-nowrap animate-fade-in z-40"
          style={{ boxShadow: '0 4px 12px rgba(20,16,10,0.10)' }}
        >
          <p className="text-xs font-medium text-label-1 tracking-[-0.01em]">{status}</p>
        </div>
      )}
    </div>
  )
}
