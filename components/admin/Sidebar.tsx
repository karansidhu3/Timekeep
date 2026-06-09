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
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-[#fffefb] border-r border-stone-100 py-6 px-3">
      <Link href="/" className="px-3 mb-8 block">
        <span className="text-lg font-semibold text-stone-900 tracking-tight">Timekeep</span>
        <span className="block text-[11px] font-medium text-stone-400 tracking-wide mt-0.5">Admin</span>
      </Link>

      <nav className="flex-1 space-y-0.5">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-stone-100/80 text-stone-900'
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
          <button className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-50 transition-colors duration-150">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
