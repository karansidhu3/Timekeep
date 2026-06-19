const Bone = ({ className }: { className?: string }) => (
  <div className={`bg-[#eae3d3] rounded-lg animate-pulse ${className ?? ''}`} />
)

export default function ScheduleLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pb-nav md:pb-12 pt-page">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <Bone className="h-8 w-28" />
          <Bone className="h-9 w-20 rounded-xl" />
        </div>
        <Bone className="h-4 w-36 mt-2" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i}>
            <div className="flex items-center gap-3 mb-1.5">
              <Bone className="w-9 h-9 rounded-xl" />
              <Bone className="h-4 w-32" />
            </div>
            {i <= 2 && (
              <div className="ml-12 rounded-xl border border-[#d3c9b2] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#f9f4ea]">
                  <Bone className="h-4 w-16" />
                  <Bone className="h-4 w-24" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
