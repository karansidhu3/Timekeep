import React from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  style?: React.CSSProperties
}

export default function Card({ children, className = '', hoverable = false, style }: Props) {
  return (
    <div
      style={style}
      className={`
        bg-[#fffefb] rounded-2xl border border-[#e4e0da] [box-shadow:var(--shadow-sm)]
        ${hoverable
          ? 'transition-all duration-200 hover:border-[#d6d1ca] hover:[box-shadow:var(--shadow-md)] active:scale-[0.99]'
          : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
