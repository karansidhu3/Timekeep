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
          bg-white text-stone-900 placeholder:text-stone-400
          border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400
          transition-shadow duration-150
          ${error ? 'border-red-400 focus:ring-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
