import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <input
        className={`
          w-full px-3.5 py-2.5 rounded-xl border text-sm min-h-[44px]
          bg-[#f7f6f3] text-stone-900 placeholder:text-stone-400
          border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/20
          transition-shadow duration-150
          ${error ? 'border-red-400 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
