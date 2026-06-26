import { Skeleton } from "@/components/shared/skeleton"

export default function SummaryCardSkeleton() {
  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full max-w-[200px]" />
          </div>
        ))}
      </div>
    </div>
  )
}
