const Bone = ({ className }: { className?: string }) => (
  <div className={`bg-[#eae3d3] rounded-lg animate-pulse ${className ?? ''}`} />
)

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pb-nav md:pb-12 pt-page">
      <div className="flex items-start justify-between mb-10">
        <div>
          <Bone className="h-8 w-16 mb-2" />
          <Bone className="h-4 w-28" />
        </div>
      </div>

      {/* Hero number */}
      <div className="mb-10">
        <div className="flex items-baseline gap-3 mb-1.5">
          <Bone className="h-20 w-24 rounded-xl" />
          <Bone className="h-5 w-28" />
        </div>
      </div>

      {/* Card group */}
      <div className="rounded-xl border border-[#d3c9b2] overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between px-4 py-4 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0">
            <div className="flex items-center gap-3">
              <Bone className="w-8 h-8 rounded-full" />
              <div>
                <Bone className="h-4 w-20 mb-1.5" />
                <Bone className="h-3 w-28" />
              </div>
            </div>
            <Bone className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
