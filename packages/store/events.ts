export const INCIDENT_EVENT_TYPES = [
  'incident.opened',
  'incident.acknowledged',
  'incident.resolved',
] as const;

export type IncidentEventType = (typeof INCIDENT_EVENT_TYPES)[number];

export type IncidentEventSource = 'monitor' | 'api';

export type IncidentEvent = {
  id: string;
  type: IncidentEventType;
  incidentId: string;
  source: IncidentEventSource;
  occurredAt: string;
};

export type IncidentAction =
  | { type: 'none' }
  | { type: 'opened'; incidentId: string }
  | { type: 'resolved'; incidentId: string };

export function incidentEventTypeFromAction(
  action: Exclude<IncidentAction, { type: 'none' }>
): IncidentEventType {
  if (action.type === 'opened') {
    return 'incident.opened';
  }

  return 'incident.resolved';
}

export function parseIncidentEventType(value: string): IncidentEventType | null {
  return INCIDENT_EVENT_TYPES.includes(value as IncidentEventType)
    ? (value as IncidentEventType)
    : null;
}

export function incidentEventTypeToDb(
  eventType: IncidentEventType
): 'incident_opened' | 'incident_acknowledged' | 'incident_resolved' {
  switch (eventType) {
    case 'incident.opened':
      return 'incident_opened';
    case 'incident.acknowledged':
      return 'incident_acknowledged';
    case 'incident.resolved':
      return 'incident_resolved';
  }
}

export function incidentEventTypeFromDb(
  eventType: 'incident_opened' | 'incident_acknowledged' | 'incident_resolved'
): IncidentEventType {
  switch (eventType) {
    case 'incident_opened':
      return 'incident.opened';
    case 'incident_acknowledged':
      return 'incident.acknowledged';
    case 'incident_resolved':
      return 'incident.resolved';
  }
}
