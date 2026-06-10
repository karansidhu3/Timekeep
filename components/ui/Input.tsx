import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#44403c] tracking-[-0.01em]">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-2xl border text-sm min-h-[44px]
          bg-[#f0ede8] text-[#0d0c0b] placeholder:text-[#a8a29e]
          border-[#e4e0da] focus:outline-none focus:border-[#78716c] focus:ring-2 focus:ring-[#141210]/10
          transition-all duration-150 tracking-[-0.01em]
          ${error ? 'border-red-400 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
