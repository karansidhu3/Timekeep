import Sidebar from '@/components/admin/Sidebar'
import MobileAdminNav from '@/components/admin/MobileAdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f5f2] flex pb-nav">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-0 md:ml-52">{children}</main>
      <MobileAdminNav />
    </div>
  )
}
