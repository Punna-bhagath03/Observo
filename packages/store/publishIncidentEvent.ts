import {
  publishIncidentEvent as publishToStream,
  type StreamIncidentEvent,
} from 'redisstream/incident-events';
import {
  incidentEventTypeFromAction,
  type IncidentAction,
  type IncidentEvent,
  type IncidentEventSource,
  type IncidentEventType,
} from './events';

export type { IncidentAction, IncidentEvent, IncidentEventSource, IncidentEventType };

export async function publishIncidentEvent(input: {
  type: IncidentEventType;
  incidentId: string;
  source: IncidentEventSource;
  occurredAt?: Date;
  id?: string;
}): Promise<void> {
  const event: StreamIncidentEvent = {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    incidentId: input.incidentId,
    source: input.source,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
  };

  try {
    await publishToStream(event);
  } catch (error) {
    console.error('Failed to publish incident event', event, error);
  }
}

export async function publishIncidentAction(
  action: IncidentAction,
  source: IncidentEventSource
): Promise<void> {
  if (action.type === 'none') {
    return;
  }

  await publishIncidentEvent({
    type: incidentEventTypeFromAction(action),
    incidentId: action.incidentId,
    source,
  });
}
