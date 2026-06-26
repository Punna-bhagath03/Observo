import type { MonitorSummary } from "@/lib/metrics"
import { formatDuration, formatTimelineDate } from "@/lib/utils"

type MonitorSummaryCardsProps = {
  monitor: MonitorSummary
}

function MonitorCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <p className="text-[12px] font-medium tracking-wider text-gray-400 uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-base font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[12px] text-gray-500">{hint}</p> : null}
    </div>
  )
}

export default function MonitorSummaryCards({ monitor }: MonitorSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MonitorCard
        label="Currently up for"
        value={
          monitor.status === "Up" && monitor.upForMs !== null
            ? formatDuration(monitor.upForMs)
            : monitor.status === "Down"
              ? "Down"
              : "—"
        }
      />
      <MonitorCard
        label="Last checked"
        value={
          monitor.lastCheckedAt
            ? formatTimelineDate(monitor.lastCheckedAt)
            : "—"
        }
      />
      <MonitorCard
        label="Incidents"
        value={String(monitor.incidentCount)}
        hint="All time for this region"
      />
      <MonitorCard
        label="Check interval"
        value={`${monitor.checkIntervalMinutes} min`}
      />
    </div>
  )
}
