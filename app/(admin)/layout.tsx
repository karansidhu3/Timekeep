import Sidebar from '@/components/admin/Sidebar'
import MobileAdminNav from '@/components/admin/MobileAdminNav'
import AdminPageTransition from '@/components/admin/AdminPageTransition'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2ece2] flex pb-nav">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-0 md:ml-52">
        <AdminPageTransition>{children}</AdminPageTransition>
      </main>
      <MobileAdminNav />
    </div>
  )
}
