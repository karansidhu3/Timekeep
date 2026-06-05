interface Props {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
