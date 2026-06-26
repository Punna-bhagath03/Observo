import { Skeleton } from "@/components/shared/skeleton"

type PageHeaderSkeletonProps = {
  actionCount?: number
}

export default function PageHeaderSkeleton({
  actionCount = 2,
}: PageHeaderSkeletonProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-3.5 w-64 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <Skeleton className="h-9 w-28 rounded-xl" />
        {Array.from({ length: actionCount }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
