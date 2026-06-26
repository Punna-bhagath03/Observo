import IncidentsDetailSkeleton from "@/components/shared/skeletons/incidentsDetailSkeleton"
import PageHeaderSkeleton from "@/components/shared/skeletons/pageHeaderSkeleton"
import SummaryCardSkeleton from "@/components/shared/skeletons/summaryCardSkeleton"

export default function WebsiteIncidentsPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton actionCount={0} />
      <SummaryCardSkeleton />
      <IncidentsDetailSkeleton />
    </>
  )
}
