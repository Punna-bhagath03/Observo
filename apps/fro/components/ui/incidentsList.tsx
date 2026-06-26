import { formatDuration } from "@/lib/utils"

export type Incident = {
  id: string
  started_at: string
  resolved_at: string | null
  ongoing: boolean
  duration_ms: number | null
  acknowledged_at: string | null
  acknowledged_by: string | null
  resolved_by: string | null
}

type IncidentsListProps = {
  incidents: Incident[]
  onAcknowledge?: (incidentId: string) => void
  onResolve?: (incidentId: string) => void
  actionLoading?: boolean
}

function getDurationLabel(incident: Incident): string {
  if (incident.ongoing) {
    return formatDuration(Date.now() - new Date(incident.started_at).getTime())
  }

  return incident.duration_ms ? formatDuration(incident.duration_ms) : "—"
}

export default function IncidentsList({
  incidents,
  onAcknowledge,
  onResolve,
  actionLoading,
}: IncidentsListProps) {
  const ongoingIncident = incidents.find((incident) => incident.ongoing)

  return (
    <>
      {ongoingIncident ? (
        <ActiveIncidentPanel
          incident={ongoingIncident}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
          loading={actionLoading}
        />
      ) : null}

      {incidents.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-gray-400">
          No incidents recorded for this region in the last 20 events.
        </div>
      ) : (
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
                <tr
                  key={incident.id}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {new Date(incident.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {incident.resolved_at
                      ? new Date(incident.resolved_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {getDurationLabel(incident)}
                  </td>
                  <td className="px-4 py-3">
                    <IncidentStatusCell incident={incident} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ActiveIncidentPanel({
  incident,
  onAcknowledge,
  onResolve,
  loading,
}: {
  incident: Incident
  onAcknowledge?: (incidentId: string) => void
  onResolve?: (incidentId: string) => void
  loading?: boolean
}) {
  const acknowledged = Boolean(incident.acknowledged_by)

  return (
    <div
      className={
        acknowledged
          ? "border-b border-yellow-500/25 bg-yellow-500/10 px-4 py-3"
          : "border-b border-red-500/20 bg-red-500/5 px-4 py-3"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className={`text-xs font-semibold ${acknowledged ? "text-yellow-300" : "text-red-300"}`}
          >
            Incident currently open
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Started {new Date(incident.started_at).toLocaleString()} · ongoing
            for {getDurationLabel(incident)}
          </p>
          {incident.acknowledged_by ? (
            <AcknowledgedBy username={incident.acknowledged_by} />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!acknowledged && onAcknowledge ? (
            <ActionButton
              label="Acknowledge"
              onClick={() => onAcknowledge(incident.id)}
              loading={loading}
              variant="ack"
            />
          ) : null}
          {onResolve ? (
            <ActionButton
              label="Mark service as recovered"
              onClick={() => onResolve(incident.id)}
              loading={loading}
              variant="primary"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function AcknowledgedBy({ username }: { username: string }) {
  return (
    <p className="mt-2 text-xs font-medium text-yellow-600">
      Acknowledged by {username}
    </p>
  )
}

function AckBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold text-yellow-500">
      Ack
    </span>
  )
}

export { AckBadge }

function ActionButton({
  label,
  onClick,
  loading,
  variant = "default",
}: {
  label: string
  onClick: () => void
  loading?: boolean
  variant?: "default" | "primary" | "ack"
}) {
  const styles = {
    primary:
      "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20",
    ack: "border-yellow-500/40 bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25",
    default:
      "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10",
  }[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {label}
    </button>
  )
}

function IncidentStatusCell({ incident }: { incident: Incident }) {
  if (incident.ongoing) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <OngoingOutageBadge />
          {incident.acknowledged_by ? <AckBadge /> : null}
        </div>
        {incident.acknowledged_by ? (
          <AcknowledgedBy username={incident.acknowledged_by} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-300">
        Resolved
      </span>
      {incident.resolved_by && incident.resolved_at ? (
        <p className="text-xs text-gray-400">
          Closed by {incident.resolved_by} at{" "}
          {new Date(incident.resolved_at).toLocaleString()}
        </p>
      ) : incident.resolved_at ? (
        <p className="text-xs text-gray-400">
          Auto-recovered at {new Date(incident.resolved_at).toLocaleString()}
        </p>
      ) : null}
    </div>
  )
}

export function OngoingOutageBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      Ongoing
    </span>
  )
}
