interface Props {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-[#fffefb] rounded-2xl border border-stone-200 [box-shadow:var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  )
}
