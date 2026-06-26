import { Skeleton } from "@/components/shared/skeleton"

const barHeights = ["h-[35%]", "h-[55%]", "h-[40%]", "h-[70%]", "h-[50%]", "h-[85%]", "h-[45%]", "h-[60%]", "h-[75%]", "h-[42%]", "h-[68%]", "h-[52%]"]

export default function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex h-[220px] items-end justify-between gap-1.5 px-1">
        {barHeights.map((height, index) => (
          <Skeleton key={index} className={`w-full max-w-5 ${height}`} />
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}
