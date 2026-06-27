import { prismaClient } from 'store/client';
import { parseIncidentEventType, type IncidentEvent } from 'store/events';
import { processIncidentEvent } from 'store/notifications';
import type { StreamIncidentMessage } from 'redisstream/incident-events';

import { sendEmail } from './senders/email';

function toIncidentEvent(message: StreamIncidentMessage['message']): IncidentEvent | null {
  const type = parseIncidentEventType(message.type);
  if (!type || !message.id || !message.incidentId) {
    return null;
  }

  return {
    id: message.id,
    type,
    incidentId: message.incidentId,
    source: message.source === 'api' ? 'api' : 'monitor',
    occurredAt: message.occurredAt,
  };
}

export async function handleIncidentStreamMessage(
  entry: StreamIncidentMessage
) {
  const event = toIncidentEvent(entry.message);
  if (!event) {
    return;
  }

  await processIncidentEvent(prismaClient, event, sendEmail);
}
