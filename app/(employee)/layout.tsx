import BottomNav from '@/components/employee/BottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      {children}
      <BottomNav />
    </div>
  )
}
