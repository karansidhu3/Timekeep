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
        bg-[#fffefb] rounded-2xl border border-stone-200 [box-shadow:var(--shadow-sm)]
        ${hoverable ? 'transition-[box-shadow,background-color] duration-150 hover:bg-stone-50/60 hover:[box-shadow:var(--shadow-md)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
