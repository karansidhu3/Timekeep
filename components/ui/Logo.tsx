// Timekeep logo system.
//
// The mark is a geometric T — horizontal bar at top, vertical bar below —
// which reads as both the letter T and a timeline marker / clock-in pin.
// It works at 16px (favicon) through 512px (app icon).
//
// Usage:
//   <Logo />                  — mark + wordmark, default size
//   <Logo size="sm" />        — compact lockup for tight spaces
//   <Logo size="lg" />        — large, for login page
//   <LogoMark size={20} />    — mark only, for inline use

interface LogoMarkProps {
  size?: number
  className?: string
  color?: string
}

export function LogoMark({ size = 20, className = '', color = 'currentColor' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 5.5h12M10 5.5v9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Mark inside a rounded-square container — the "app icon" form
interface LogoIconProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  const radius = Math.round(size * 0.25)
  const markSize = Math.round(size * 0.55)

  return (
    <div
      className={`inline-flex items-center justify-center bg-stone-900 flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
    >
      <LogoMark size={markSize} color="white" />
    </div>
  )
}

// Full lockup: icon + wordmark
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm',   gap: 'gap-2',   sub: 'text-[10px]' },
  md: { icon: 30, text: 'text-base', gap: 'gap-2.5', sub: 'text-[11px]' },
  lg: { icon: 38, text: 'text-xl',   gap: 'gap-3',   sub: 'text-xs'     },
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = sizeMap[size]
  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LogoIcon size={s.icon} />
      <span className={`font-semibold tracking-tight text-stone-900 ${s.text}`}>
        Timekeep
      </span>
    </div>
  )
}
