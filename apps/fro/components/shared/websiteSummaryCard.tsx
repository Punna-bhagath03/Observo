import StatusBadge from "@/components/shared/statusBadge"
import { IncidentSummary } from "@/components/shared/incidentSummary"
import type { Incident } from "@/components/ui/incidentsList"

type WebsiteSummaryCardProps = {
  url: string
  status: "Up" | "Down" | "checking"
  incidents?: Incident[]
}

export default function WebsiteSummaryCard({
  url,
  status,
  incidents = [],
}: WebsiteSummaryCardProps) {
  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
            URL
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-white transition-colors hover:text-cyan-400"
          >
            {url}
          </a>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
            Overall status
          </p>
          <StatusBadge status={status} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium tracking-wider text-gray-400 uppercase">
            Incidents
          </p>
          <IncidentSummary incidents={incidents} />
        </div>
      </div>
    </div>
  )
}
