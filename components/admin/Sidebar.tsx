'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/schedule', label: 'Schedule' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/time-entries', label: 'Time entries' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-white border-r border-stone-200 py-6 px-3">
      <Link href="/" className="px-3 mb-8 block">
        <span className="text-base font-semibold text-stone-900 tracking-tight">Timekeep</span>
        <span className="block text-xs text-stone-400 font-medium">Admin</span>
      </Link>

      <nav className="flex-1 space-y-0.5">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-stone-100">
        <form action={signOut}>
          <button className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-50 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
