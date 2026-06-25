import { prismaClient } from './index';

export const CONSECUTIVE_DOWNS_TO_OPEN = 2;

type TickInput = {
  website_id: string;
  region_id: string;
  status: 'Up' | 'Down' | 'Unknown';
  createdAt: Date;
};

export const incidentInclude = {
  acknowledged_by: { select: { username: true } },
  resolved_by: { select: { username: true } },
} as const;

type IncidentWithUsers = {
  id: string;
  started_at: Date;
  resolved_at: Date | null;
  acknowledged_at: Date | null;
  acknowledged_by: { username: string } | null;
  resolved_by: { username: string } | null;
};

export function formatIncident(incident: IncidentWithUsers) {
  return {
    id: incident.id,
    started_at: incident.started_at,
    resolved_at: incident.resolved_at,
    ongoing: incident.resolved_at === null,
    duration_ms: incident.resolved_at
      ? incident.resolved_at.getTime() - incident.started_at.getTime()
      : null,
    acknowledged_at: incident.acknowledged_at,
    acknowledged_by: incident.acknowledged_by?.username ?? null,
    resolved_by: incident.resolved_by?.username ?? null,
  };
}

async function getOwnedOpenIncident(
  incidentId: string,
  websiteId: string,
  userId: string
) {
  return prismaClient.incident.findFirst({
    where: {
      id: incidentId,
      website_id: websiteId,
      resolved_at: null,
      website: { user_id: userId },
    },
    include: incidentInclude,
  });
}

export async function acknowledgeIncident(
  incidentId: string,
  websiteId: string,
  userId: string
) {
  const incident = await getOwnedOpenIncident(incidentId, websiteId, userId);
  if (!incident) {
    return null;
  }

  if (incident.acknowledged_at) {
    return incident;
  }

  return prismaClient.incident.update({
    where: { id: incident.id },
    data: {
      acknowledged_at: new Date(),
      acknowledged_by_user_id: userId,
    },
    include: incidentInclude,
  });
}

export async function resolveIncidentManually(
  incidentId: string,
  websiteId: string,
  userId: string
) {
  const incident = await getOwnedOpenIncident(incidentId, websiteId, userId);
  if (!incident) {
    return null;
  }

  return prismaClient.incident.update({
    where: { id: incident.id },
    data: {
      resolved_at: new Date(),
      resolved_by_user_id: userId,
    },
    include: incidentInclude,
  });
}

export async function handleIncident(tick: TickInput) {
  const openIncident = await prismaClient.incident.findFirst({
    where: {
      website_id: tick.website_id,
      region_id: tick.region_id,
      resolved_at: null,
    },
  });

  if (tick.status === 'Up') {
    if (openIncident) {
      await prismaClient.incident.update({
        where: { id: openIncident.id },
        data: { resolved_at: tick.createdAt },
      });
    }
    return;
  }

  if (tick.status !== 'Down' || openIncident) {
    return;
  }

  const recentTicks = await prismaClient.website_tick.findMany({
    where: {
      website_id: tick.website_id,
      region_id: tick.region_id,
    },
    orderBy: { createdAt: 'desc' },
    take: CONSECUTIVE_DOWNS_TO_OPEN,
  });

  const allDown =
    recentTicks.length === CONSECUTIVE_DOWNS_TO_OPEN &&
    recentTicks.every((recentTick) => recentTick.status === 'Down');

  if (!allDown) {
    return;
  }

  await prismaClient.incident.create({
    data: {
      website_id: tick.website_id,
      region_id: tick.region_id,
      started_at: recentTicks[recentTicks.length - 1]!.createdAt,
    },
  });
}
