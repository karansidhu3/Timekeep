import BottomNav from '@/components/employee/BottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf9f7] pb-20">
      {children}
      <BottomNav />
    </div>
  )
}
