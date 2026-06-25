export type TimelineEventType =
  | 'website_added'
  | 'check_down'
  | 'check_up'
  | 'incident_opened'
  | 'incident_acknowledged'
  | 'incident_resolved_manual'
  | 'incident_resolved_auto';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  at: Date;
  username?: string | null;
};

type WebsiteInput = {
  url: string;
  time_added: Date;
};

type IncidentInput = {
  id: string;
  started_at: Date;
  resolved_at: Date | null;
  acknowledged_at: Date | null;
  acknowledged_by: { username: string } | null;
  resolved_by: { username: string } | null;
};

type TickInput = {
  id: string;
  status: 'Up' | 'Down' | 'Unknown';
  createdAt: Date;
};

const TYPE_SORT_PRIORITY: Record<TimelineEventType, number> = {
  incident_resolved_manual: 7,
  incident_resolved_auto: 6,
  check_up: 5,
  incident_acknowledged: 4,
  incident_opened: 3,
  check_down: 2,
  website_added: 1,
};

export function buildIncidentTimeline(
  website: WebsiteInput,
  incidents: IncidentInput[],
  ticks: TickInput[]
): TimelineEvent[] {
  const sortedIncidents = [...incidents].sort(
    (a, b) => a.started_at.getTime() - b.started_at.getTime()
  );
  const sortedTicks = [...ticks].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const usedDownTickIds = new Set<string>();

  const events: TimelineEvent[] = [
    {
      id: 'website-added',
      type: 'website_added',
      at: website.time_added,
    },
  ];

  for (let index = 0; index < sortedIncidents.length; index++) {
    const incident = sortedIncidents[index]!;
    const nextIncident = sortedIncidents[index + 1];
    const openingDowns = findOpeningDownTicks(
      sortedTicks,
      incident,
      nextIncident?.started_at ?? null,
      usedDownTickIds
    );

    for (const tick of openingDowns) {
      events.push({
        id: `down-${incident.id}-${tick.id}`,
        type: 'check_down',
        at: tick.createdAt,
      });
      usedDownTickIds.add(tick.id);
    }

    const openedAt = new Date(
      (openingDowns.length > 0
        ? openingDowns[openingDowns.length - 1]!.createdAt
        : incident.started_at
      ).getTime() + 1
    );

    events.push({
      id: `opened-${incident.id}`,
      type: 'incident_opened',
      at: openedAt,
    });

    if (incident.acknowledged_at) {
      events.push({
        id: `ack-${incident.id}`,
        type: 'incident_acknowledged',
        at: incident.acknowledged_at,
        username: incident.acknowledged_by?.username ?? null,
      });
    }

    if (!incident.resolved_at) {
      continue;
    }

    if (incident.resolved_by) {
      events.push({
        id: `resolved-manual-${incident.id}`,
        type: 'incident_resolved_manual',
        at: incident.resolved_at,
        username: incident.resolved_by.username,
      });
      continue;
    }

    const upTick = findRecoveryTick(sortedTicks, incident.resolved_at);
    if (upTick) {
      events.push({
        id: `up-${incident.id}-${upTick.id}`,
        type: 'check_up',
        at: upTick.createdAt,
      });
    }

    events.push({
      id: `resolved-auto-${incident.id}`,
      type: 'incident_resolved_auto',
      at: new Date(
        (upTick?.createdAt ?? incident.resolved_at).getTime() + 1
      ),
    });
  }

  return events.sort(compareTimelineEvents);
}

function compareTimelineEvents(a: TimelineEvent, b: TimelineEvent): number {
  const timeDiff = b.at.getTime() - a.at.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return TYPE_SORT_PRIORITY[b.type] - TYPE_SORT_PRIORITY[a.type];
}

function findOpeningDownTicks(
  ticks: TickInput[],
  incident: IncidentInput,
  nextIncidentStart: Date | null,
  usedDownTickIds: Set<string>
): TickInput[] {
  const startMs = incident.started_at.getTime();
  const upperBoundMs = Math.min(
    incident.acknowledged_at?.getTime() ?? Number.MAX_SAFE_INTEGER,
    incident.resolved_at?.getTime() ?? Number.MAX_SAFE_INTEGER,
    nextIncidentStart?.getTime() ?? Number.MAX_SAFE_INTEGER
  );

  const first = ticks.find(
    (tick) =>
      tick.status === 'Down' &&
      !usedDownTickIds.has(tick.id) &&
      Math.abs(tick.createdAt.getTime() - startMs) <= 120_000
  );

  if (!first) {
    return [];
  }

  const second = ticks.find(
    (tick) =>
      tick.status === 'Down' &&
      !usedDownTickIds.has(tick.id) &&
      tick.id !== first.id &&
      tick.createdAt.getTime() > first.createdAt.getTime() &&
      tick.createdAt.getTime() <= upperBoundMs
  );

  return second ? [first, second] : [first];
}

function findRecoveryTick(
  ticks: TickInput[],
  resolvedAt: Date
): TickInput | undefined {
  const resolvedMs = resolvedAt.getTime();

  return ticks.find(
    (tick) =>
      tick.status === 'Up' &&
      Math.abs(tick.createdAt.getTime() - resolvedMs) < 2000
  );
}

export function formatTimelineEvent(
  event: TimelineEvent,
  websiteUrl: string
): {
  id: string;
  type: TimelineEventType;
  at: Date;
  title: string;
  detail: string | null;
  username: string | null;
} {
  const username = event.username ?? null;

  switch (event.type) {
    case 'website_added':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: 'Website added',
        detail: websiteUrl,
        username: null,
      };
    case 'check_down':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: 'Website is down',
        detail: websiteUrl,
        username: null,
      };
    case 'check_up':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: 'Website is up again',
        detail: websiteUrl,
        username: null,
      };
    case 'incident_opened':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: 'Incident started',
        detail: 'Opened after 2 consecutive failed checks',
        username: null,
      };
    case 'incident_acknowledged':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: `${username} acknowledged the incident`,
        detail: null,
        username,
      };
    case 'incident_resolved_manual':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: `${username} marked the service as recovered`,
        detail: 'Incident closed manually',
        username,
      };
    case 'incident_resolved_auto':
      return {
        id: event.id,
        type: event.type,
        at: event.at,
        title: 'Incident automatically resolved',
        detail: 'Closed after the website recovered',
        username: null,
      };
  }
}
