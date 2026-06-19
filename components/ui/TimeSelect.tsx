// TimeSelect replaces <input type="time"> which renders as a blank box on iOS
// until tapped. A <select> shows a visible current value and triggers the
// native iOS wheel picker on tap — much more intuitive on mobile.

interface Props {
  name: string
  defaultValue?: string   // "HH:MM" — e.g. "09:00"
  required?: boolean
  label?: string
  className?: string
}

// 15-minute increments — covers all practical shift scheduling needs.
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

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-label-2 tracking-[-0.01em]">{label}</label>
      )}
      <select
        name={name}
        defaultValue={normalised}
        required={required}
        className={`
          w-full px-4 py-3 rounded-xl border border-[#d3c9b2]
          text-sm bg-[#eae3d3] text-label-1
          focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
          min-h-[44px] tracking-[-0.01em] ${className}
        `}
      >
        <option value="">Select time…</option>
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
