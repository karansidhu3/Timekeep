import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:   'bg-[#141210] text-[#f5f3ef] hover:bg-[#1e1c19] active:bg-[#0d0c0b]',
  secondary: 'bg-[#f0ede8] text-[#1a1917] hover:bg-[#e8e4de] active:bg-[#ddd9d3]',
  danger:    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  ghost:     'text-[#44403c] hover:bg-[#f0ede8] active:bg-[#e8e4de]',
  dark:      'bg-white/10 text-white hover:bg-white/15 active:bg-white/20 border border-white/10',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm min-h-[40px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3.5 text-[15px] min-h-[52px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl font-medium
        transition-all duration-150 cursor-pointer tracking-[-0.01em]
        active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
