'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { signOut } from '@/lib/actions/auth'

const links = [
  {
    href: '/dashboard',
    label: 'Today',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: '/schedule',
    label: 'Schedule',
    icon: (active: boolean) => (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-100">
      {/* items sit above the home indicator */}
      <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-150 ${
                active ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              {icon(active)}
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => startTransition(() => signOut())}
          disabled={isPending}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-stone-400 transition-colors disabled:opacity-50"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="text-xs font-medium">{isPending ? '…' : 'Sign out'}</span>
        </button>
      </div>
    </nav>
  )
}
