import { Skeleton } from "@/components/shared/skeleton"

export default function IncidentsDetailSkeleton() {
  return (
    <>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 border-b border-white/5 px-4 py-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="space-y-3 px-4 py-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 border-b border-white/5 px-4 py-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="space-y-4 px-4 py-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="mt-1 h-3 w-3 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
