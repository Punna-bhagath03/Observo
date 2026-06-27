import type { PeriodStatRow } from "@/lib/metrics"
import {
  formatDuration,
  formatPeriodAvailability,
  formatTimelineDate,
} from "@/lib/utils"
import type { PublicIncident } from "@/lib/publicStatus"

function formatPeriodDuration(ms: number | null): string {
  if (ms === null || ms <= 0) {
    return "none"
  }
  return formatDuration(ms)
}

export function PublicPeriodStatsTable({ rows }: { rows: PeriodStatRow[] }) {
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-4 py-3">Time period</th>
            <th className="px-4 py-3">Availability</th>
            <th className="px-4 py-3">Downtime</th>
            <th className="px-4 py-3">Incidents</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-white/5 last:border-b-0">
              <td className="px-4 py-3 text-xs font-medium text-gray-200">
                {row.label}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-white">
                {formatPeriodAvailability(row.availability)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-300">
                {formatPeriodDuration(row.downtimeMs)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-300">{row.incidents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function incidentDuration(incident: PublicIncident): string {
  if (incident.ongoing) {
    return formatDuration(Date.now() - new Date(incident.started_at).getTime())
  }

  return incident.duration_ms ? formatDuration(incident.duration_ms) : "—"
}

export function PublicIncidentHistory({
  incidents,
}: {
  incidents: PublicIncident[]
}) {
  if (incidents.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-gray-400">
        No incidents recorded.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">
            <th className="px-4 py-3">Started</th>
            <th className="px-4 py-3">Resolved</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id} className="border-b border-white/5 last:border-b-0">
              <td className="px-4 py-3 text-xs text-gray-300">
                {formatTimelineDate(incident.started_at)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-300">
                {incident.resolved_at
                  ? formatTimelineDate(incident.resolved_at)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-300">
                {incidentDuration(incident)}
              </td>
              <td className="px-4 py-3 text-xs">
                {incident.ongoing ? (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-300">
                    Ongoing
                  </span>
                ) : (
                  <span className="text-gray-400">Resolved</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
