import { BACKEND_URL } from "./utils"

export type IncidentEventType =
  | "incident.opened"
  | "incident.acknowledged"
  | "incident.resolved"

export const INCIDENT_EVENT_TYPES: IncidentEventType[] = [
  "incident.opened",
  "incident.acknowledged",
  "incident.resolved",
]

export type NotificationSettings = {
  email: string | null
  rules: Record<IncidentEventType, boolean>
}

export const INCIDENT_EVENT_LABELS: Record<IncidentEventType, string> = {
  "incident.opened": "Incident opened",
  "incident.acknowledged": "Incident acknowledged",
  "incident.resolved": "Incident resolved",
}

export async function fetchNotificationSettings(
  token: string
): Promise<NotificationSettings> {
  const response = await fetch(`${BACKEND_URL}/notifications/settings`, {
    headers: { Authorization: token },
  })

  if (!response.ok) {
    throw new Error("Could not load notification settings.")
  }

  return response.json()
}

export async function saveNotificationSettings(
  token: string,
  settings: { email: string; rules: Record<IncidentEventType, boolean> }
): Promise<NotificationSettings> {
  const response = await fetch(`${BACKEND_URL}/notifications/settings`, {
    method: "PATCH",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  })

  if (!response.ok) {
    throw new Error("Could not save notification settings.")
  }

  return response.json()
}
