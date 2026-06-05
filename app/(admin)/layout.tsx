import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-0 md:ml-56">{children}</main>
    </div>
  )
}
