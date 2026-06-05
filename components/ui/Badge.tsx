interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variants = {
  default: 'bg-stone-100 text-stone-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
}

export default function Badge({ children, variant = 'default' }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
