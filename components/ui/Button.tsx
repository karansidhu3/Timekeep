import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-stone-900 text-white active:bg-stone-950 hover:bg-stone-800',
  secondary: 'bg-stone-100 text-stone-800 active:bg-stone-300 hover:bg-stone-200',
  danger: 'bg-red-600 text-white active:bg-red-700 hover:bg-red-500',
  ghost: 'text-stone-600 active:bg-stone-200 hover:bg-stone-100',
}

const sizes = {
  sm: 'px-3 py-2.5 text-sm min-h-[44px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-5 py-3.5 text-base min-h-[44px]',
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
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-[colors,transform] duration-150 cursor-pointer
        active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
