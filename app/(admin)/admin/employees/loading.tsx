const Bone = ({ className }: { className?: string }) => (
  <div className={`bg-[#eae3d3] rounded-lg animate-pulse ${className ?? ''}`} />
)

export default function EmployeesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-12 pt-page">
      <div className="flex items-center justify-between mb-8">
        <Bone className="h-8 w-20" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>

      <div className="rounded-xl border border-[#d3c9b2] overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0">
            <div className="flex items-center gap-3">
              <Bone className="w-8 h-8 rounded-full" />
              <div>
                <Bone className="h-4 w-28 mb-1.5" />
                <Bone className="h-3 w-16" />
              </div>
            </div>
            <Bone className="h-4 w-4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
