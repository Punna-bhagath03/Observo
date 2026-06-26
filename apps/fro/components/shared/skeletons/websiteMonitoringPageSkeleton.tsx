import MonitoringPanelSkeleton from "@/components/shared/skeletons/monitoringPanelSkeleton"
import PageHeaderSkeleton from "@/components/shared/skeletons/pageHeaderSkeleton"
import SummaryCardSkeleton from "@/components/shared/skeletons/summaryCardSkeleton"

export default function WebsiteMonitoringPageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton actionCount={0} />
      <SummaryCardSkeleton />
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
        <MonitoringPanelSkeleton />
      </div>
    </>
  )
}
