'use client'

import { usePathname } from 'next/navigation'
import { useRef } from 'react'

const TAB_ORDER = [
  '/admin/dashboard',
  '/admin/schedule',
  '/admin/time-entries',
  '/admin/employees',
  '/admin/templates',
]

function getTabIndex(pathname: string): number {
  return TAB_ORDER.findIndex(t => pathname.startsWith(t))
}

export default function AdminPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPathRef = useRef<string>(pathname)

  const prevIdx = getTabIndex(prevPathRef.current)
  const currIdx = getTabIndex(pathname)

  let animClass = 'animate-page-in'
  if (prevPathRef.current !== pathname && prevIdx !== -1 && currIdx !== -1) {
    animClass = currIdx > prevIdx ? 'animate-slide-right' : 'animate-slide-left'
  }

  prevPathRef.current = pathname

  return (
    <div
      key={pathname}
      className={animClass}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) {
          e.currentTarget.classList.remove(animClass)
        }
      }}
    >
      {children}
    </div>
  )
}
