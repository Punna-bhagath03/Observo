import type { PrismaClient } from './generated/prisma/client';
import {
  buildPresetPeriodStats,
  computeMonitorSummaryFromState,
  resolveStreakStartAt,
  type IncidentInput,
  type MonitorSummary,
  type PeriodStatRow,
  type TickInput,
} from './metrics';
import {
  buildWebsiteStats,
  getStatsWindowStart,
  type WebsiteStats,
} from './stats';

export type PublicIncident = {
  id: string;
  started_at: string;
  resolved_at: string | null;
  ongoing: boolean;
  duration_ms: number | null;
};

export type PublicStatusPage = {
  url: string;
  slug: string;
  regionId: string;
  region: string;
  monitor: MonitorSummary;
  stats24h: WebsiteStats;
  periodStats: PeriodStatRow[];
  incidents: PublicIncident[];
};

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function isValidStatusPageSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function slugBaseFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const base = hostname
      .replace(/\./g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);

    return base.length >= 2 ? base : 'status';
  } catch {
    return 'status';
  }
}

export function formatPublicIncident(incident: {
  id: string;
  started_at: Date;
  resolved_at: Date | null;
}): PublicIncident {
  return {
    id: incident.id,
    started_at: incident.started_at.toISOString(),
    resolved_at: incident.resolved_at?.toISOString() ?? null,
    ongoing: incident.resolved_at === null,
    duration_ms: incident.resolved_at
      ? incident.resolved_at.getTime() - incident.started_at.getTime()
      : null,
  };
}

export async function resolveMonitorStreakStartAt(
  prisma: PrismaClient,
  websiteId: string,
  regionId: string,
  websiteAddedAt: Date,
  latestTick: TickInput | null
): Promise<Date | null> {
  if (!latestTick || latestTick.status !== 'Up') {
    return null;
  }

  const lastDown = await prisma.website_tick.findFirst({
    where: {
      website_id: websiteId,
      region_id: regionId,
      status: 'Down',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      response_time_ms: true,
      createdAt: true,
    },
  });

  const [firstUpAfterLastDown, firstUpEver] = await Promise.all([
    lastDown
      ? prisma.website_tick.findFirst({
          where: {
            website_id: websiteId,
            region_id: regionId,
            status: 'Up',
            createdAt: { gt: lastDown.createdAt },
          },
          orderBy: { createdAt: 'asc' },
          select: {
            status: true,
            response_time_ms: true,
            createdAt: true,
          },
        })
      : Promise.resolve(null),
    lastDown
      ? Promise.resolve(null)
      : prisma.website_tick.findFirst({
          where: {
            website_id: websiteId,
            region_id: regionId,
            status: 'Up',
          },
          orderBy: { createdAt: 'asc' },
          select: {
            status: true,
            response_time_ms: true,
            createdAt: true,
          },
        }),
  ]);

  return resolveStreakStartAt({
    latest: latestTick,
    lastDown,
    firstUpAfterLastDown,
    firstUpEver,
    websiteAddedAt,
  });
}

export function buildPublicStatusPage(input: {
  url: string;
  slug: string;
  regionId: string;
  regionName: string;
  websiteAddedAt: Date;
  ticks24h: TickInput[];
  latestTick: TickInput | null;
  monitorStreakStartAt: Date | null;
  allIncidents: IncidentInput[];
  recentIncidents: Array<{
    id: string;
    started_at: Date;
    resolved_at: Date | null;
  }>;
  windowStart: Date;
  windowEnd?: Date;
  now?: Date;
}): PublicStatusPage {
  const now = input.now ?? new Date();
  const windowEnd = input.windowEnd ?? now;

  return {
    url: input.url,
    slug: input.slug,
    regionId: input.regionId,
    region: input.regionName,
    monitor: computeMonitorSummaryFromState(
      input.latestTick,
      input.monitorStreakStartAt,
      input.allIncidents,
      now
    ),
    stats24h: buildWebsiteStats(
      input.ticks24h,
      input.allIncidents,
      input.windowStart,
      windowEnd
    ),
    periodStats: buildPresetPeriodStats(
      input.allIncidents,
      input.websiteAddedAt,
      now
    ),
    incidents: input.recentIncidents.map(formatPublicIncident),
  };
}

export async function loadPublicStatusPage(
  prisma: PrismaClient,
  slug: string,
  regionId: string,
  now = new Date()
): Promise<PublicStatusPage | null> {
  const website = await prisma.website.findFirst({
    where: {
      status_page_enabled: true,
      status_page_slug: slug,
    },
    select: {
      id: true,
      url: true,
      time_added: true,
      status_page_slug: true,
    },
  });

  if (!website?.status_page_slug) {
    return null;
  }

  const region = await prisma.region.findFirst({
    where: { id: regionId },
    select: { id: true, name: true },
  });

  if (!region) {
    return null;
  }

  const windowStart = getStatsWindowStart(now);
  const windowEnd = now;

  const [ticks24h, latestTick, allIncidents, recentIncidents] =
    await Promise.all([
      prisma.website_tick.findMany({
        where: {
          website_id: website.id,
          region_id: regionId,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          response_time_ms: true,
          createdAt: true,
        },
      }),
      prisma.website_tick.findFirst({
        where: {
          website_id: website.id,
          region_id: regionId,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          response_time_ms: true,
          createdAt: true,
        },
      }),
      prisma.incident.findMany({
        where: {
          website_id: website.id,
          region_id: regionId,
        },
        select: {
          started_at: true,
          resolved_at: true,
        },
      }),
      prisma.incident.findMany({
        where: {
          website_id: website.id,
          region_id: regionId,
        },
        orderBy: { started_at: 'desc' },
        take: 20,
        select: {
          id: true,
          started_at: true,
          resolved_at: true,
        },
      }),
    ]);

  const monitorStreakStartAt = await resolveMonitorStreakStartAt(
    prisma,
    website.id,
    regionId,
    website.time_added,
    latestTick
  );

  return buildPublicStatusPage({
    url: website.url,
    slug: website.status_page_slug,
    regionId: region.id,
    regionName: region.name,
    websiteAddedAt: website.time_added,
    ticks24h,
    latestTick,
    monitorStreakStartAt,
    allIncidents,
    recentIncidents,
    windowStart,
    windowEnd,
    now,
  });
}

export async function generateUniqueSlug(
  prisma: PrismaClient,
  base: string
): Promise<string> {
  const normalized = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const root = normalized.length >= 2 ? normalized : 'status';

  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`;
    const candidate = `${root.slice(0, Math.max(2, 64 - suffix.length))}${suffix}`;

    if (!isValidStatusPageSlug(candidate)) {
      continue;
    }

    const existing = await prisma.website.findFirst({
      where: { status_page_slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${root.slice(0, 54)}-${crypto.randomUUID().slice(0, 6)}`;
}
