import PageHeaderSkeleton from "@/components/shared/skeletons/pageHeaderSkeleton"
import TableSkeleton from "@/components/shared/skeletons/tableSkeleton"

type ListPageSkeletonProps = {
  columns?: number
  rows?: number
  actionCount?: number
}

export default function ListPageSkeleton({
  columns = 4,
  rows = 6,
  actionCount = 1,
}: ListPageSkeletonProps) {
  return (
    <>
      <PageHeaderSkeleton actionCount={actionCount} />
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
        <TableSkeleton columns={columns} rows={rows} />
      </div>
    </>
  )
}
