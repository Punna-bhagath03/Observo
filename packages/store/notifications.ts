import type { PrismaClient } from './generated/prisma/client';
import {
  INCIDENT_EVENT_TYPES,
  incidentEventTypeFromDb,
  incidentEventTypeToDb,
  type IncidentEvent,
  type IncidentEventType,
} from './events';
import { generateWebhookSecret } from './webhookSignature';
import { validateWebhookUrl } from './webhookUrl';

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

export type WebhookPayload = {
  id: string;
  type: IncidentEventType;
  occurred_at: string;
  incident: {
    id: string;
    website_url: string;
    region: string;
    started_at: string;
    resolved_at: string | null;
    status: 'ongoing' | 'resolved';
    duration_minutes: number;
    acknowledged_by: string | null;
    resolved_by: string | null;
  };
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

export type WebhookSender = (input: {
  url: string;
  secret: string;
  payload: WebhookPayload;
  eventId: string;
}) => Promise<void>;

export type NotificationSenders = {
  email: EmailSender;
  webhook: WebhookSender;
};

type ChannelType = 'email' | 'webhook';

type EmailChannel = {
  channelId: string;
  email: string;
};

type WebhookChannel = {
  channelId: string;
  url: string;
  secret: string;
};

const EVENT_LABELS: Record<IncidentEventType, string> = {
  'incident.opened': 'Incident opened',
  'incident.acknowledged': 'Incident acknowledged',
  'incident.resolved': 'Incident resolved',
};

const DEFAULT_RULES = (): Record<IncidentEventType, boolean> => ({
  'incident.opened': true,
  'incident.acknowledged': false,
  'incident.resolved': true,
});

function durationMinutes(context: NotificationContext): number {
  const durationMs = context.resolvedAt
    ? context.resolvedAt.getTime() - context.startedAt.getTime()
    : context.occurredAt.getTime() - context.startedAt.getTime();

  return Math.max(1, Math.round(durationMs / 60_000));
}

export function buildNotification(
  context: NotificationContext
): BuiltNotification {
  const duration = durationMinutes(context);
  const subject = `[Observo] ${EVENT_LABELS[context.eventType]} — ${context.websiteUrl} (${context.regionName})`;

  const lines = [
    EVENT_LABELS[context.eventType],
    '',
    `Website: ${context.websiteUrl}`,
    `Region: ${context.regionName}`,
    `Started: ${context.startedAt.toISOString()}`,
    `Status: ${context.resolvedAt ? 'Resolved' : 'Ongoing'}`,
    `Duration: ~${duration} minute(s)`,
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

export function buildWebhookPayload(
  context: NotificationContext
): WebhookPayload {
  return {
    id: context.eventId,
    type: context.eventType,
    occurred_at: context.occurredAt.toISOString(),
    incident: {
      id: context.incidentId,
      website_url: context.websiteUrl,
      region: context.regionName,
      started_at: context.startedAt.toISOString(),
      resolved_at: context.resolvedAt?.toISOString() ?? null,
      status: context.resolvedAt ? 'resolved' : 'ongoing',
      duration_minutes: durationMinutes(context),
      acknowledged_by: context.acknowledgedBy,
      resolved_by: context.resolvedBy,
    },
  };
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

async function listEmailChannelsForEvent(
  prisma: PrismaClient,
  userId: string,
  eventType: IncidentEventType
): Promise<EmailChannel[]> {
  const channels = await listChannelsForEvent(prisma, userId, eventType, 'email');

  return channels.flatMap((channel) => {
    const config = channel.config as { email?: string };
    if (!config.email) {
      return [];
    }

    return [{ channelId: channel.id, email: config.email }];
  });
}

async function listWebhookChannelsForEvent(
  prisma: PrismaClient,
  userId: string,
  eventType: IncidentEventType
): Promise<WebhookChannel[]> {
  const channels = await listChannelsForEvent(
    prisma,
    userId,
    eventType,
    'webhook'
  );

  return channels.flatMap((channel) => {
    const config = channel.config as { url?: string; secret?: string };
    if (!config.url || !config.secret) {
      return [];
    }

    return [
      {
        channelId: channel.id,
        url: config.url,
        secret: config.secret,
      },
    ];
  });
}

async function listChannelsForEvent(
  prisma: PrismaClient,
  userId: string,
  eventType: IncidentEventType,
  channelType: ChannelType
) {
  const dbEventType = incidentEventTypeToDb(eventType);

  return prisma.notification_channel.findMany({
    where: {
      user_id: userId,
      type: channelType,
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

async function attemptDelivery(
  prisma: PrismaClient,
  context: NotificationContext,
  channelId: string,
  deliver: () => Promise<void>,
  logContext: Record<string, unknown>
) {
  const claimed = await claimDelivery(prisma, {
    channelId,
    incidentId: context.incidentId,
    eventType: context.eventType,
  });

  if (!claimed) {
    return;
  }

  try {
    await deliver();
    await markDeliverySent(prisma, {
      channelId,
      incidentId: context.incidentId,
      eventType: context.eventType,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Delivery failed';
    console.error('[notification failed]', {
      eventId: context.eventId,
      eventType: context.eventType,
      incidentId: context.incidentId,
      error: errorMessage,
      ...logContext,
    });
    await markDeliveryFailed(prisma, {
      channelId,
      incidentId: context.incidentId,
      eventType: context.eventType,
      error: errorMessage,
    });
  }
}

export async function processIncidentEvent(
  prisma: PrismaClient,
  event: IncidentEvent,
  senders: NotificationSenders
) {
  const context = await loadNotificationContext(prisma, event);
  if (!context) {
    return;
  }

  const message = buildNotification(context);
  const payload = buildWebhookPayload(context);

  const [emailChannels, webhookChannels] = await Promise.all([
    listEmailChannelsForEvent(prisma, context.userId, context.eventType),
    listWebhookChannelsForEvent(prisma, context.userId, context.eventType),
  ]);

  await Promise.all([
    ...emailChannels.map((channel) =>
      attemptDelivery(
        prisma,
        context,
        channel.channelId,
        () =>
          senders.email({
            to: channel.email,
            subject: message.subject,
            text: message.text,
          }),
        { channel: 'email', to: channel.email }
      )
    ),
    ...webhookChannels.map((channel) =>
      attemptDelivery(
        prisma,
        context,
        channel.channelId,
        () =>
          senders.webhook({
            url: channel.url,
            secret: channel.secret,
            payload,
            eventId: context.eventId,
          }),
        { channel: 'webhook', url: channel.url }
      )
    ),
  ]);
}

export type ChannelSettings = {
  rules: Record<IncidentEventType, boolean>;
};

export type EmailSettings = ChannelSettings & {
  address: string | null;
};

export type WebhookSettings = ChannelSettings & {
  url: string | null;
  enabled: boolean;
  hasSecret: boolean;
};

export type NotificationSettings = {
  email: EmailSettings;
  webhook: WebhookSettings;
};

function rulesFromChannel(
  rules: { event_type: Parameters<typeof incidentEventTypeFromDb>[0]; enabled: boolean }[]
): Record<IncidentEventType, boolean> {
  const mapped = DEFAULT_RULES();

  for (const rule of rules) {
    mapped[incidentEventTypeFromDb(rule.event_type)] = rule.enabled;
  }

  return mapped;
}

export async function getNotificationSettings(
  prisma: PrismaClient,
  userId: string
): Promise<NotificationSettings> {
  const channels = await prisma.notification_channel.findMany({
    where: {
      user_id: userId,
      type: { in: ['email', 'webhook'] },
    },
    include: { rules: true },
  });

  const emailChannel = channels.find((channel) => channel.type === 'email');
  const webhookChannel = channels.find((channel) => channel.type === 'webhook');
  const emailConfig = (emailChannel?.config ?? {}) as { email?: string };
  const webhookConfig = (webhookChannel?.config ?? {}) as {
    url?: string;
    secret?: string;
  };

  return {
    email: {
      address: emailConfig.email ?? null,
      rules: emailChannel ? rulesFromChannel(emailChannel.rules) : DEFAULT_RULES(),
    },
    webhook: {
      url: webhookConfig.url ?? null,
      enabled: webhookChannel?.enabled ?? false,
      hasSecret: Boolean(webhookConfig.secret),
      rules: webhookChannel
        ? rulesFromChannel(webhookChannel.rules)
        : DEFAULT_RULES(),
    },
  };
}

async function upsertChannelRules(
  prisma: PrismaClient,
  channelId: string,
  rules: Record<IncidentEventType, boolean>
) {
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
        enabled: rules[eventType],
      },
      update: {
        enabled: rules[eventType],
      },
    });
  }
}

async function upsertChannelRecord(
  prisma: PrismaClient,
  userId: string,
  type: ChannelType,
  config: Record<string, string>,
  options?: { label?: string; channelId?: string }
): Promise<string> {
  if (options?.channelId) {
    return (
      await prisma.notification_channel.update({
        where: { id: options.channelId },
        data: {
          enabled: true,
          config,
          ...(options.label ? { label: options.label } : {}),
        },
        select: { id: true },
      })
    ).id;
  }

  const existing = await prisma.notification_channel.findFirst({
    where: { user_id: userId, type },
    select: { id: true },
  });

  if (existing) {
    return upsertChannelRecord(prisma, userId, type, config, {
      label: options?.label,
      channelId: existing.id,
    });
  }

  return (
    await prisma.notification_channel.create({
      data: {
        user_id: userId,
        type,
        config,
        ...(options?.label ? { label: options.label } : {}),
      },
      select: { id: true },
    })
  ).id;
}

export async function upsertEmailNotificationSettings(
  prisma: PrismaClient,
  userId: string,
  input: {
    address: string;
    rules: Record<IncidentEventType, boolean>;
  }
) {
  const channelId = await upsertChannelRecord(
    prisma,
    userId,
    'email',
    { email: input.address }
  );

  await upsertChannelRules(prisma, channelId, input.rules);
}

export async function upsertWebhookNotificationSettings(
  prisma: PrismaClient,
  userId: string,
  input: {
    url: string;
    rules: Record<IncidentEventType, boolean>;
    regenerateSecret?: boolean;
  }
): Promise<{ secret?: string }> {
  const validatedUrl = validateWebhookUrl(input.url);
  const existing = await prisma.notification_channel.findFirst({
    where: { user_id: userId, type: 'webhook' },
    select: { id: true, config: true },
  });

  const existingConfig = (existing?.config ?? {}) as {
    url?: string;
    secret?: string;
  };

  let secret = existingConfig.secret;
  let returnedSecret: string | undefined;

  if (!secret || input.regenerateSecret) {
    secret = generateWebhookSecret();
    returnedSecret = secret;
  }

  const channelId = await upsertChannelRecord(
    prisma,
    userId,
    'webhook',
    {
      url: validatedUrl,
      secret,
    },
    {
      label: 'Webhook',
      channelId: existing?.id,
    }
  );

  await upsertChannelRules(prisma, channelId, input.rules);

  return returnedSecret ? { secret: returnedSecret } : {};
}

export async function disableWebhookNotificationSettings(
  prisma: PrismaClient,
  userId: string
) {
  await prisma.notification_channel.updateMany({
    where: { user_id: userId, type: 'webhook' },
    data: { enabled: false },
  });
}
