import { Skeleton } from "@/components/shared/skeleton"

type TableSkeletonProps = {
  columns?: number
  rows?: number
}

const columnWidths = ["w-48", "w-20", "w-24", "w-28", "w-20", "w-16"]

export default function TableSkeleton({
  columns = 4,
  rows = 6,
}: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto px-4 py-3">
      <div className="mb-3 flex gap-6 border-b border-white/5 pb-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-20 shrink-0" />
        ))}
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-6 border-b border-white/5 py-3.5 last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={`h-4 shrink-0 ${columnWidths[columnIndex % columnWidths.length]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
