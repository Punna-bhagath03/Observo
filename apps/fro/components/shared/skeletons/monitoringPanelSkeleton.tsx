import ChartSkeleton from "@/components/shared/skeletons/chartSkeleton"
import TableSkeleton from "@/components/shared/skeletons/tableSkeleton"
import { Skeleton } from "@/components/shared/skeleton"

type MonitoringPanelSkeletonProps = {
  chartOnly?: boolean
}

export default function MonitoringPanelSkeleton({
  chartOnly = false,
}: MonitoringPanelSkeletonProps) {
  if (chartOnly) {
    return (
      <div className="px-4 pb-2">
        <ChartSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-52 max-w-full" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[76px] rounded-xl" />
        ))}
      </div>

      <div className="px-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-14 rounded-lg" />
          ))}
        </div>
        <ChartSkeleton />
      </div>

      <div>
        <div className="space-y-2 border-b border-white/5 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <TableSkeleton columns={6} rows={6} />
      </div>
    </div>
  )
}
