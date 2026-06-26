import { AckBadge, OngoingOutageBadge, type Incident } from "@/components/ui/incidentsList"

export function IncidentSummary({ incidents }: { incidents: Incident[] }) {
  const ongoingIncident = incidents.find((incident) => incident.ongoing)
  const pastCount = incidents.filter((incident) => !incident.ongoing).length

  if (ongoingIncident) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <OngoingOutageBadge />
        {ongoingIncident.acknowledged_by ? <AckBadge /> : null}
      </div>
    )
  }

  if (pastCount === 0) {
    return <span className="text-xs text-gray-500">None</span>
  }

  return (
    <span className="text-xs font-medium text-gray-300">
      {pastCount} {pastCount === 1 ? "incident" : "incidents"}
    </span>
  )
}
