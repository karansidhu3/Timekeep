const Bone = ({ className }: { className?: string }) => (
  <div className={`bg-[#eae3d3] rounded-lg animate-pulse ${className ?? ''}`} />
)

export default function TimeEntriesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-10 pt-page">
      <div className="mb-8">
        <Bone className="h-8 w-32 mb-2" />
        <Bone className="h-4 w-24" />
      </div>

      {/* Weekly summary */}
      <div className="mb-8">
        <Bone className="h-3 w-16 mb-3" />
        <div className="rounded-xl border border-[#d3c9b2] overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3.5 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0">
              <div className="flex items-center gap-3">
                <Bone className="w-7 h-7 rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <Bone className="h-4 w-20" />
                    <Bone className="h-4 w-16" />
                  </div>
                  <Bone className="h-0.5 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="flex items-center justify-between mb-5">
        <Bone className="h-3 w-20" />
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
      <div className="rounded-xl border border-[#d3c9b2] overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 bg-[#f9f4ea] border-b border-[#d3c9b2] last:border-0">
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
