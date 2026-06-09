'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import Logo from '@/components/ui/Logo'

const operationalLinks = [
  { href: '/admin/dashboard', label: 'Today' },
  { href: '/admin/schedule', label: 'Schedule' },
  { href: '/admin/time-entries', label: 'Time entries' },
]

const setupLinks = [
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/templates', label: 'Templates' },
]

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = pathname.startsWith(href)
  return (
    <Link
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
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-[#fffefb] border-r border-stone-100 py-6 px-3">
      <Link href="/" className="px-3 mb-8 block">
        <Logo size="sm" />
      </Link>

      <nav className="flex-1 space-y-0.5">
        {operationalLinks.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} pathname={pathname} />
        ))}

        <div className="my-3 border-t border-stone-100" />

        {setupLinks.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} pathname={pathname} />
        ))}
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
