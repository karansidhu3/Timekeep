import BottomNav from '@/components/employee/BottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2ece2]">
      {children}
      <BottomNav />
    </div>
  )
}
