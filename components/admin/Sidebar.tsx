'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { LogoMark } from '@/components/ui/Logo'

const operationalLinks = [
  { href: '/admin/dashboard', label: 'Today' },
  { href: '/admin/schedule', label: 'Schedule' },
  { href: '/admin/time-entries', label: 'Time entries' },
]

const setupLinks = [
  { href: '/admin/employees', label: 'People' },
  { href: '/admin/templates', label: 'Templates' },
]

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-xl text-sm transition-all duration-150 tracking-[-0.01em] ${
        active
          ? 'bg-[#eae3d3] text-label-1 font-semibold'
          : 'text-label-3 hover:text-label-1 hover:bg-[#eae3d3]'
      }`}
    >
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-52 border-r border-[#d3c9b2] py-5 px-3 bg-[#f2ece2]">
      <Link href="/" className="px-3 mb-8 block">
        <div className="flex items-center gap-2">
          <LogoMark size={16} color="#0d0c0b" />
          <span className="text-sm font-semibold tracking-tight text-label-1">Timekeep</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-px">
        {operationalLinks.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} pathname={pathname} />
        ))}

        <div className="my-3 border-t border-[#d3c9b2]" />

        {setupLinks.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} pathname={pathname} />
        ))}
      </nav>

      <div className="pt-3 border-t border-[#d3c9b2]">
        <form action={signOut}>
          <button className="w-full text-left px-3 py-2 text-sm font-medium text-label-1 rounded-xl bg-[#eae3d3] hover:bg-[#ddd4be] active:bg-[#d3c9b2] transition-colors duration-150 tracking-[-0.01em]">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
