import { computePeriodStats } from './metrics';

type TickForStats = {
  status: 'Up' | 'Down' | 'Unknown';
  response_time_ms: number;
  createdAt: Date;
};

type IncidentForStats = {
  started_at: Date;
  resolved_at: Date | null;
};

export type WebsiteStats = {
  uptimePercentage: number;
  avgResponseTimeMs: number;
  failures: number;
  totalChecks: number;
  lastOutageAt: string | null;
};

const STATS_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getStatsWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - STATS_WINDOW_MS);
}

export function computeStats(ticks: TickForStats[]): WebsiteStats {
  const upTicks = ticks.filter((tick) => tick.status === 'Up');
  const downTicks = ticks.filter((tick) => tick.status === 'Down');
  const knownTicks = ticks.filter((tick) => tick.status !== 'Unknown');

  const uptimePercentage =
    knownTicks.length > 0 ? (upTicks.length / knownTicks.length) * 100 : 0;

  const avgResponseTimeMs =
    upTicks.length > 0
      ? Math.round(
          upTicks.reduce((sum, tick) => sum + tick.response_time_ms, 0) /
            upTicks.length
        )
      : 0;

  const lastOutage = downTicks.reduce<TickForStats | null>((latest, tick) => {
    if (!latest || tick.createdAt > latest.createdAt) {
      return tick;
    }
    return latest;
  }, null);

  return {
    uptimePercentage: Number(uptimePercentage.toFixed(1)),
    avgResponseTimeMs,
    failures: downTicks.length,
    totalChecks: ticks.length,
    lastOutageAt: lastOutage ? lastOutage.createdAt.toISOString() : null,
  };
}

export function buildWebsiteStats(
  ticks: TickForStats[],
  incidents: IncidentForStats[],
  windowStart: Date,
  windowEnd = new Date()
): WebsiteStats {
  const tickStats = computeStats(ticks);

  if (tickStats.totalChecks === 0) {
    return tickStats;
  }

  const availability24h = computePeriodStats(
    'Last 24 hours',
    windowStart,
    windowEnd,
    incidents,
    windowEnd
  ).availability;

  return {
    ...tickStats,
    uptimePercentage: Number(availability24h.toFixed(1)),
  };
}
