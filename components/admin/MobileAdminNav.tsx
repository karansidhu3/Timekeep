'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  {
    href: '/admin/dashboard',
    label: 'Today',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    href: '/admin/schedule',
    label: 'Schedule',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    href: '/admin/time-entries',
    label: 'Log',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    href: '/admin/employees',
    label: 'People',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
]

export default function MobileAdminNav() {
  const pathname = usePathname()
  const activeIdx = links.findIndex(({ href }) => pathname.startsWith(href))

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-[#f9f4ea]/92 backdrop-blur-xl border-t border-[#d3c9b2]/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative flex h-16">
        {/* Sliding top-edge indicator */}
        {activeIdx !== -1 && (
          <span
            className="absolute top-0 h-[2px] rounded-full bg-[#141210]"
            style={{
              width: `calc(100% / ${links.length} - 3rem)`,
              left: `calc(${activeIdx} * (100% / ${links.length}) + 1.5rem)`,
              transition: 'left 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        )}

        {links.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                active ? 'text-label-1' : 'text-[#b8b4ae]'
              }`}
            >
              {icon(active)}
              <span className={`text-[11px] font-medium tracking-[-0.01em] ${
                active ? 'text-label-1' : 'text-[#b8b4ae]'
              }`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
