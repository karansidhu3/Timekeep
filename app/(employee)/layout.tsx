import BottomNav from '@/components/employee/BottomNav'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2ece2]" style={{ minHeight: '100dvh' }}>
      {children}
      <BottomNav />
    </div>
  )
}
