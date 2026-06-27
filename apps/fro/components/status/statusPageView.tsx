import StatusBadge from "@/components/shared/statusBadge"
import RegionSelect from "@/components/shared/regionSelect"
import Spinner from "@/components/shared/spinner"
import type { PublicRegion, PublicStatusPage } from "@/lib/publicStatus"
import { formatDuration } from "@/lib/utils"

import {
  PublicIncidentHistory,
  PublicPeriodStatsTable,
} from "./statusPageSections"

type StatusPageViewProps = {
  page: PublicStatusPage
  regions: PublicRegion[]
  regionId: string
  onRegionChange: (regionId: string) => void
  onRefresh: () => void
  refreshing?: boolean
}

export default function StatusPageView({
  page,
  regions,
  regionId,
  onRegionChange,
  onRefresh,
  refreshing = false,
}: StatusPageViewProps) {
  const monitorStatus = page.monitor.status

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
              Status page
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {regions.length > 0 ? (
                <RegionSelect
                  regions={regions}
                  value={regionId}
                  onChange={onRegionChange}
                  disabled={refreshing}
                />
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Spinner
                  className={`h-3.5 w-3.5 text-cyan-400 ${refreshing ? "" : "hidden"}`}
                />
                Refresh
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{page.url}</h1>
          <p className="mt-2 text-xs text-gray-400">
            Monitored from {page.region} · checked every{" "}
            {page.monitor.checkIntervalMinutes} minutes
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                Overall status
              </p>
              <StatusBadge status={monitorStatus} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                Availability (24h)
              </p>
              <p className="text-xs font-semibold text-white">
                {page.stats24h.totalChecks > 0
                  ? `${page.stats24h.uptimePercentage}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
                Last checked
              </p>
              <p className="text-xs text-gray-300">
                {page.monitor.lastCheckedAt
                  ? new Date(page.monitor.lastCheckedAt).toLocaleString()
                  : "—"}
              </p>
              {monitorStatus === "Up" && page.monitor.upForMs !== null ? (
                <p className="mt-1 text-xs text-gray-500">
                  Up for {formatDuration(page.monitor.upForMs)}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Uptime</h2>
          </div>
          <PublicPeriodStatsTable rows={page.periodStats} />
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              Recent incidents
            </h2>
          </div>
          <PublicIncidentHistory incidents={page.incidents} />
        </section>

        <footer className="text-center text-xs text-gray-500">
          Powered by{" "}
          <span className="font-medium text-gray-400">Observo</span>
        </footer>
      </div>
    </div>
  )
}
