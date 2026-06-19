import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:   'bg-[#141210] text-white hover:bg-[#242220] active:bg-[#0d0c0b]',
  secondary: 'bg-[#eae3d3] text-label-1 hover:bg-[#ddd4be] active:bg-[#ddd9d3]',
  danger:    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  ghost:     'text-label-2 hover:bg-[#eae3d3] active:bg-[#ddd4be]',
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
      data-spring
      className={`
        inline-flex items-center justify-center gap-2 rounded-2xl font-medium
        transition-colors duration-150 cursor-pointer tracking-[-0.01em]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
