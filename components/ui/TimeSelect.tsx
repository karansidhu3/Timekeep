'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  name: string
  defaultValue?: string
  required?: boolean
  label?: string
  className?: string
}

const OPTIONS: { value: string; label: string }[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const h12  = h % 12 || 12
    const ampm = h >= 12 ? 'PM' : 'AM'
    const label = `${h12}:${String(m).padStart(2, '0')} ${ampm}`
    OPTIONS.push({ value, label })
  }
}

export default function TimeSelect({ name, defaultValue, required, label, className = '' }: Props) {
  const normalised = defaultValue?.slice(0, 5) ?? ''
  const [value, setValue] = useState(normalised)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, value])

  const displayLabel = OPTIONS.find(o => o.value === value)?.label ?? 'Select time…'

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={wrapRef}>
      {label && (
        <label className="text-sm font-medium text-label-2 tracking-[-0.01em]">{label}</label>
      )}
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full px-4 py-3 rounded-xl border
          text-sm text-left tracking-[-0.01em] min-h-[44px]
          focus:outline-none focus:ring-2 focus:ring-[#141210]/10 transition-colors duration-150
          ${open
            ? 'border-[#78716c] bg-[#eae3d3] ring-2 ring-[#141210]/10'
            : 'border-[#d3c9b2] bg-[#eae3d3] hover:border-[#b8ae9c]'
          }
          ${value ? 'text-label-1' : 'text-[#a09880]'}
        `}
      >
        {displayLabel}
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#d3c9b2] bg-[#f9f4ea] py-1"
          style={{ boxShadow: '0 8px 24px rgba(20,18,16,0.12), 0 2px 8px rgba(20,18,16,0.08)' }}
        >
          {OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              data-selected={o.value === value}
              onClick={() => { setValue(o.value); setOpen(false) }}
              className={`
                w-full text-left px-4 py-2 text-sm tracking-[-0.01em] transition-colors duration-75
                ${o.value === value
                  ? 'bg-[#141210] text-white'
                  : 'text-label-1 hover:bg-[#eae3d3]'
                }
              `}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
