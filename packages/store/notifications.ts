import type { PrismaClient } from './generated/prisma/client';
import {
  INCIDENT_EVENT_TYPES,
  incidentEventTypeFromDb,
  incidentEventTypeToDb,
  type IncidentEvent,
  type IncidentEventType,
} from './events';

export type NotificationContext = {
  eventId: string;
  eventType: IncidentEventType;
  incidentId: string;
  websiteUrl: string;
  regionName: string;
  userId: string;
  startedAt: Date;
  resolvedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedBy: string | null;
  occurredAt: Date;
};

export type EmailChannel = {
  channelId: string;
  email: string;
};

export type BuiltNotification = {
  subject: string;
  text: string;
};

export type EmailSender = (input: {
  to: string;
  subject: string;
  text: string;
}) => Promise<void>;

const EVENT_LABELS: Record<IncidentEventType, string> = {
  'incident.opened': 'Incident opened',
  'incident.acknowledged': 'Incident acknowledged',
  'incident.resolved': 'Incident resolved',
};

export function buildNotification(
  context: NotificationContext
): BuiltNotification {
  const durationMs = context.resolvedAt
    ? context.resolvedAt.getTime() - context.startedAt.getTime()
    : context.occurredAt.getTime() - context.startedAt.getTime();

  const durationMinutes = Math.max(1, Math.round(durationMs / 60_000));
  const subject = `[Observo] ${EVENT_LABELS[context.eventType]} — ${context.websiteUrl} (${context.regionName})`;

  const lines = [
    EVENT_LABELS[context.eventType],
    '',
    `Website: ${context.websiteUrl}`,
    `Region: ${context.regionName}`,
    `Started: ${context.startedAt.toISOString()}`,
    `Status: ${context.resolvedAt ? 'Resolved' : 'Ongoing'}`,
    `Duration: ~${durationMinutes} minute(s)`,
  ];

  if (context.acknowledgedBy) {
    lines.push(`Acknowledged by: ${context.acknowledgedBy}`);
  }

  if (context.resolvedBy) {
    lines.push(`Resolved by: ${context.resolvedBy}`);
  }

  lines.push('', '— Observo');

  return { subject, text: lines.join('\n') };
}

export async function loadNotificationContext(
  prisma: PrismaClient,
  event: IncidentEvent
): Promise<NotificationContext | null> {
  const incident = await prisma.incident.findUnique({
    where: { id: event.incidentId },
    select: {
      id: true,
      started_at: true,
      resolved_at: true,
      website: { select: { url: true, user_id: true } },
      region: { select: { name: true } },
      acknowledged_by: { select: { username: true } },
      resolved_by: { select: { username: true } },
    },
  });

  if (!incident) {
    return null;
  }

  return {
    eventId: event.id,
    eventType: event.type,
    incidentId: incident.id,
    websiteUrl: incident.website.url,
    regionName: incident.region.name,
    userId: incident.website.user_id,
    startedAt: incident.started_at,
    resolvedAt: incident.resolved_at,
    acknowledgedBy: incident.acknowledged_by?.username ?? null,
    resolvedBy: incident.resolved_by?.username ?? null,
    occurredAt: new Date(event.occurredAt),
  };
}

export async function listEmailChannelsForEvent(
  prisma: PrismaClient,
  userId: string,
  eventType: IncidentEventType
): Promise<EmailChannel[]> {
  const dbEventType = incidentEventTypeToDb(eventType);

  const channels = await prisma.notification_channel.findMany({
    where: {
      user_id: userId,
      type: 'email',
      enabled: true,
      rules: {
        some: {
          event_type: dbEventType,
          enabled: true,
        },
      },
    },
    select: {
      id: true,
      config: true,
    },
  });

  return channels.flatMap((channel) => {
    const config = channel.config as { email?: string };
    if (!config.email) {
      return [];
    }

    return [{ channelId: channel.id, email: config.email }];
  });
}

function deliveryWhere(input: {
  channelId: string;
  incidentId: string;
  eventType: IncidentEventType;
}) {
  return {
    channel_id_incident_id_event_type: {
      channel_id: input.channelId,
      incident_id: input.incidentId,
      event_type: incidentEventTypeToDb(input.eventType),
    },
  };
}

export async function claimDelivery(
  prisma: PrismaClient,
  input: {
    channelId: string;
    incidentId: string;
    eventType: IncidentEventType;
  }
): Promise<boolean> {
  const dbEventType = incidentEventTypeToDb(input.eventType);
  const deliveryKey = deliveryWhere(input);

  const existing = await prisma.notification_delivery.findUnique({
    where: deliveryKey,
  });

  if (existing) {
    if (existing.status !== 'failed') {
      return false;
    }

    await prisma.notification_delivery.update({
      where: deliveryKey,
      data: { status: 'pending', error: null },
    });
    return true;
  }

  try {
    await prisma.notification_delivery.create({
      data: {
        channel_id: input.channelId,
        incident_id: input.incidentId,
        event_type: dbEventType,
        status: 'pending',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function markDeliverySent(
  prisma: PrismaClient,
  input: {
    channelId: string;
    incidentId: string;
    eventType: IncidentEventType;
  }
) {
  await prisma.notification_delivery.update({
    where: deliveryWhere(input),
    data: { status: 'sent', error: null },
  });
}

export async function markDeliveryFailed(
  prisma: PrismaClient,
  input: {
    channelId: string;
    incidentId: string;
    eventType: IncidentEventType;
    error: string;
  }
) {
  await prisma.notification_delivery.update({
    where: deliveryWhere(input),
    data: { status: 'failed', error: input.error },
  });
}

export async function processIncidentEvent(
  prisma: PrismaClient,
  event: IncidentEvent,
  sendEmail: EmailSender
) {
  const context = await loadNotificationContext(prisma, event);
  if (!context) {
    return;
  }

  const channels = await listEmailChannelsForEvent(
    prisma,
    context.userId,
    context.eventType
  );

  if (channels.length === 0) {
    return;
  }

  const message = buildNotification(context);

  for (const channel of channels) {
    const claimed = await claimDelivery(prisma, {
      channelId: channel.channelId,
      incidentId: context.incidentId,
      eventType: context.eventType,
    });

    if (!claimed) {
      continue;
    }

    try {
      await sendEmail({
        to: channel.email,
        subject: message.subject,
        text: message.text,
      });
      await markDeliverySent(prisma, {
        channelId: channel.channelId,
        incidentId: context.incidentId,
        eventType: context.eventType,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Delivery failed';
      console.error('[notification failed]', {
        eventId: context.eventId,
        to: channel.email,
        eventType: context.eventType,
        incidentId: context.incidentId,
        error: errorMessage,
      });
      await markDeliveryFailed(prisma, {
        channelId: channel.channelId,
        incidentId: context.incidentId,
        eventType: context.eventType,
        error: errorMessage,
      });
    }
  }
}

export type NotificationSettings = {
  email: string | null;
  rules: Record<IncidentEventType, boolean>;
};

const DEFAULT_RULES = (): Record<IncidentEventType, boolean> => ({
  'incident.opened': true,
  'incident.acknowledged': false,
  'incident.resolved': true,
});

export async function getNotificationSettings(
  prisma: PrismaClient,
  userId: string
): Promise<NotificationSettings> {
  const channel = await prisma.notification_channel.findFirst({
    where: { user_id: userId, type: 'email' },
    include: { rules: true },
  });

  const rules = DEFAULT_RULES();

  if (!channel) {
    return { email: null, rules };
  }

  const config = channel.config as { email?: string };

  for (const rule of channel.rules) {
    rules[incidentEventTypeFromDb(rule.event_type)] = rule.enabled;
  }

  return {
    email: config.email ?? null,
    rules,
  };
}

export async function upsertEmailNotificationSettings(
  prisma: PrismaClient,
  userId: string,
  input: {
    email: string;
    rules: Record<IncidentEventType, boolean>;
  }
) {
  const existing = await prisma.notification_channel.findFirst({
    where: { user_id: userId, type: 'email' },
    select: { id: true },
  });

  const channelId = existing
    ? (
        await prisma.notification_channel.update({
          where: { id: existing.id },
          data: {
            enabled: true,
            config: { email: input.email },
          },
          select: { id: true },
        })
      ).id
    : (
        await prisma.notification_channel.create({
          data: {
            user_id: userId,
            type: 'email',
            config: { email: input.email },
          },
          select: { id: true },
        })
      ).id;

  for (const eventType of INCIDENT_EVENT_TYPES) {
    await prisma.notification_rule.upsert({
      where: {
        channel_id_event_type: {
          channel_id: channelId,
          event_type: incidentEventTypeToDb(eventType),
        },
      },
      create: {
        channel_id: channelId,
        event_type: incidentEventTypeToDb(eventType),
        enabled: input.rules[eventType],
      },
      update: {
        enabled: input.rules[eventType],
      },
    });
  }
}
