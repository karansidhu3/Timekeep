interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variants = {
  default: 'bg-[#eae3d3] text-label-2',
  success: 'bg-[#eef4f1] text-[#2d5a44]',
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
