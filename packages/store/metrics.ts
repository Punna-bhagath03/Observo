export const CHECK_INTERVAL_MINUTES = 3;

const STALE_CHECK_MULTIPLIER = 2;

export function isMonitorCheckStale(
  lastCheckedAt: Date | null,
  now = new Date()
): boolean {
  if (!lastCheckedAt) {
    return true;
  }

  const staleAfterMs =
    CHECK_INTERVAL_MINUTES * STALE_CHECK_MULTIPLIER * 60_000;

  return now.getTime() - lastCheckedAt.getTime() > staleAfterMs;
}

function monitorMeta(incidents: IncidentInput[]) {
  return {
    incidentCount: incidents.length,
    checkIntervalMinutes: CHECK_INTERVAL_MINUTES,
  };
}

function resolveNonUpMonitorSummary(
  latest: TickInput | null | undefined,
  incidents: IncidentInput[],
  now: Date
): MonitorSummary | null {
  if (!latest || latest.status === 'Unknown') {
    return checkingMonitorSummary(latest, incidents);
  }

  if (isMonitorCheckStale(latest.createdAt, now)) {
    return checkingMonitorSummary(latest, incidents);
  }

  if (latest.status === 'Down') {
    return downMonitorSummary(latest, incidents);
  }

  return null;
}

function checkingMonitorSummary(
  latest: TickInput | null | undefined,
  incidents: IncidentInput[]
): MonitorSummary {
  return {
    status: 'checking',
    upForMs: null,
    lastCheckedAt: latest?.createdAt.toISOString() ?? null,
    ...monitorMeta(incidents),
  };
}

function downMonitorSummary(
  latest: TickInput,
  incidents: IncidentInput[]
): MonitorSummary {
  return {
    status: 'Down',
    upForMs: null,
    lastCheckedAt: latest.createdAt.toISOString(),
    ...monitorMeta(incidents),
  };
}

function upMonitorSummary(
  latest: TickInput,
  streakStart: Date,
  now: Date,
  incidents: IncidentInput[]
): MonitorSummary {
  return {
    status: 'Up',
    upForMs: Math.max(now.getTime() - streakStart.getTime(), 0),
    lastCheckedAt: latest.createdAt.toISOString(),
    ...monitorMeta(incidents),
  };
}

export type MetricsRange = 'hour' | 'day' | 'week' | 'month' | 'custom';

export type TickInput = {
  status: 'Up' | 'Down' | 'Unknown';
  response_time_ms: number;
  createdAt: Date;
};

export type IncidentInput = {
  started_at: Date;
  resolved_at: Date | null;
};

export type MonitorSummary = {
  status: 'Up' | 'Down' | 'checking';
  upForMs: number | null;
  lastCheckedAt: string | null;
  incidentCount: number;
  checkIntervalMinutes: number;
};

export type GraphPoint = {
  t: number;
  avgMs: number | null;
  maxMs: number | null;
  availability: number | null;
};

export type GraphData = {
  range: MetricsRange;
  bucketMs: number;
  from: string;
  to: string;
  points: GraphPoint[];
};

export type PeriodStatRow = {
  label: string;
  from: string;
  to: string;
  availability: number;
  downtimeMs: number;
  incidents: number;
  longestIncidentMs: number | null;
  avgIncidentMs: number | null;
};

export type WebsiteMetrics = {
  monitor: MonitorSummary;
  graph: GraphData;
  periodStats: PeriodStatRow[];
  customStats: PeriodStatRow | null;
};

type ResolvedWindow = {
  from: Date;
  to: Date;
  bucketMs: number;
  range: MetricsRange;
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const RANGE_BUCKET_MS: Record<Exclude<MetricsRange, 'custom'>, number> = {
  hour: MINUTE_MS,
  day: 15 * MINUTE_MS,
  week: HOUR_MS,
  month: 6 * HOUR_MS,
};

const RANGE_WINDOW_MS: Record<Exclude<MetricsRange, 'custom'>, number> = {
  hour: HOUR_MS,
  day: DAY_MS,
  week: 7 * DAY_MS,
  month: 30 * DAY_MS,
};

export function resolveMetricsRange(
  range: Exclude<MetricsRange, 'custom'>,
  now = new Date()
): ResolvedWindow {
  return {
    from: new Date(now.getTime() - RANGE_WINDOW_MS[range]),
    to: now,
    bucketMs: RANGE_BUCKET_MS[range],
    range,
  };
}

export function resolveCustomRange(from: Date, to: Date): ResolvedWindow {
  return {
    from,
    to,
    bucketMs: getBucketMs(from, to),
    range: 'custom',
  };
}

export function getBucketMs(
  from: Date,
  to: Date,
  targetPoints = 300
): number {
  const spanMs = Math.max(to.getTime() - from.getTime(), MINUTE_MS);
  const rawBucket = Math.ceil(spanMs / targetPoints);
  return Math.max(MINUTE_MS, rawBucket);
}

export function bucketResponseTimes(
  ticks: TickInput[],
  from: Date,
  to: Date,
  bucketMs: number
): GraphPoint[] {
  if (to.getTime() <= from.getTime()) {
    return [];
  }

  const points: GraphPoint[] = [];
  const fromMs = from.getTime();
  const toMs = to.getTime();

  for (let bucketStart = fromMs; bucketStart < toMs; bucketStart += bucketMs) {
    const bucketEnd = Math.min(bucketStart + bucketMs, toMs);
    const bucketTicks = ticks.filter(
      (tick) =>
        tick.createdAt.getTime() >= bucketStart &&
        tick.createdAt.getTime() < bucketEnd
    );

    const upTicks = bucketTicks.filter((tick) => tick.status === 'Up');
    const knownTicks = bucketTicks.filter((tick) => tick.status !== 'Unknown');

    points.push({
      t: bucketStart,
      avgMs:
        upTicks.length > 0
          ? Math.round(
              upTicks.reduce((sum, tick) => sum + tick.response_time_ms, 0) /
                upTicks.length
            )
          : null,
      maxMs:
        upTicks.length > 0
          ? Math.max(...upTicks.map((tick) => tick.response_time_ms))
          : null,
      availability:
        knownTicks.length > 0
          ? Number(
              (
                (knownTicks.filter((tick) => tick.status === 'Up').length /
                  knownTicks.length) *
                100
              ).toFixed(4)
            )
          : null,
    });
  }

  return points;
}

export function clipIncidentDurationMs(
  incident: IncidentInput,
  from: Date,
  to: Date,
  now = new Date()
): number {
  const incidentEnd = incident.resolved_at ?? now;
  const overlapStart = Math.max(incident.started_at.getTime(), from.getTime());
  const overlapEnd = Math.min(incidentEnd.getTime(), to.getTime());
  return Math.max(0, overlapEnd - overlapStart);
}

export function incidentOverlapsPeriod(
  incident: IncidentInput,
  from: Date,
  to: Date,
  now = new Date()
): boolean {
  const incidentEnd = incident.resolved_at ?? now;
  return (
    incident.started_at.getTime() < to.getTime() &&
    incidentEnd.getTime() > from.getTime()
  );
}

export function computeIncidentDowntime(
  incidents: IncidentInput[],
  from: Date,
  to: Date,
  now = new Date()
): number {
  return incidents.reduce(
    (total, incident) =>
      total + clipIncidentDurationMs(incident, from, to, now),
    0
  );
}

export function computePeriodStats(
  label: string,
  from: Date,
  to: Date,
  incidents: IncidentInput[],
  now = new Date()
): PeriodStatRow {
  const periodMs = Math.max(to.getTime() - from.getTime(), 0);
  const downtimeMs = computeIncidentDowntime(incidents, from, to, now);
  const overlapping = incidents.filter((incident) =>
    incidentOverlapsPeriod(incident, from, to, now)
  );
  const durations = overlapping.map((incident) =>
    clipIncidentDurationMs(incident, from, to, now)
  );
  const activeDurations = durations.filter((duration) => duration > 0);

  const availability =
    periodMs > 0
      ? Number(
          (
            (Math.max(periodMs - downtimeMs, 0) / periodMs) *
            100
          ).toFixed(4)
        )
      : 0;

  return {
    label,
    from: from.toISOString(),
    to: to.toISOString(),
    availability,
    downtimeMs,
    incidents: overlapping.length,
    longestIncidentMs:
      activeDurations.length > 0 ? Math.max(...activeDurations) : null,
    avgIncidentMs:
      activeDurations.length > 0
        ? Math.round(
            activeDurations.reduce((sum, duration) => sum + duration, 0) /
              activeDurations.length
          )
        : null,
  };
}

export function computeMonitorSummary(
  ticks: TickInput[],
  incidents: IncidentInput[],
  now = new Date()
): MonitorSummary {
  const sorted = [...ticks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const latest = sorted[0];
  const nonUp = resolveNonUpMonitorSummary(latest, incidents, now);

  if (nonUp) {
    return nonUp;
  }

  let streakStart = latest!.createdAt;
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index]!.status !== 'Up') {
      break;
    }
    streakStart = sorted[index]!.createdAt;
  }

  return upMonitorSummary(latest!, streakStart, now, incidents);
}

export function resolveStreakStartAt(input: {
  latest: TickInput;
  lastDown: TickInput | null;
  firstUpAfterLastDown: TickInput | null;
  firstUpEver: TickInput | null;
  websiteAddedAt: Date;
}): Date {
  if (input.lastDown) {
    return (
      input.firstUpAfterLastDown?.createdAt ??
      input.latest.createdAt
    );
  }

  return input.firstUpEver?.createdAt ?? input.websiteAddedAt;
}

export function computeMonitorSummaryFromState(
  latest: TickInput | null,
  streakStartAt: Date | null,
  incidents: IncidentInput[],
  now = new Date()
): MonitorSummary {
  const nonUp = resolveNonUpMonitorSummary(latest, incidents, now);

  if (nonUp) {
    return nonUp;
  }

  const streakStart = streakStartAt ?? latest!.createdAt;

  return upMonitorSummary(latest!, streakStart, now, incidents);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatCustomPeriodLabel(
  from: Date,
  to: Date,
  now = new Date()
): string {
  const fromLabel = from.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const endsToday =
    to.getTime() >= now.getTime() - 60_000 ||
    (to.getFullYear() === now.getFullYear() &&
      to.getMonth() === now.getMonth() &&
      to.getDate() === now.getDate());

  if (endsToday) {
    return `Since ${fromLabel} until today`;
  }

  const toLabel = to.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `Since ${fromLabel} until ${toLabel}`;
}

export function buildPresetPeriodStats(
  incidents: IncidentInput[],
  websiteAddedAt: Date,
  now = new Date()
): PeriodStatRow[] {
  return [
    computePeriodStats('Today', startOfDay(now), now, incidents, now),
    computePeriodStats(
      'Last 7 days',
      new Date(now.getTime() - 7 * DAY_MS),
      now,
      incidents,
      now
    ),
    computePeriodStats(
      'Last 30 days',
      new Date(now.getTime() - 30 * DAY_MS),
      now,
      incidents,
      now
    ),
    computePeriodStats(
      'Last 365 days',
      new Date(now.getTime() - 365 * DAY_MS),
      now,
      incidents,
      now
    ),
    computePeriodStats(
      `All time (${Math.max(
        1,
        Math.ceil((now.getTime() - websiteAddedAt.getTime()) / DAY_MS)
      )} days)`,
      websiteAddedAt,
      now,
      incidents,
      now
    ),
  ];
}

export function buildWebsiteMetrics(input: {
  windowTicks?: TickInput[];
  monitorLatest?: TickInput | null;
  monitorStreakStartAt?: Date | null;
  /** @deprecated Use windowTicks + monitorLatest for production callers */
  ticks?: TickInput[];
  incidents: IncidentInput[];
  websiteAddedAt: Date;
  window: ResolvedWindow;
  includePresetPeriodStats: boolean;
  customLabel?: string;
  now?: Date;
}): WebsiteMetrics {
  const now = input.now ?? new Date();
  const { from, to, bucketMs, range } = input.window;
  const windowTicks =
    input.windowTicks ??
    input.ticks?.filter(
      (tick) =>
        tick.createdAt.getTime() >= from.getTime() &&
        tick.createdAt.getTime() <= to.getTime()
    ) ??
    [];

  const monitor =
    input.monitorLatest !== undefined
      ? computeMonitorSummaryFromState(
          input.monitorLatest,
          input.monitorStreakStartAt ?? null,
          input.incidents,
          now
        )
      : computeMonitorSummary(input.ticks ?? [], input.incidents, now);

  return {
    monitor,
    graph: {
      range,
      bucketMs,
      from: from.toISOString(),
      to: to.toISOString(),
      points: bucketResponseTimes(windowTicks, from, to, bucketMs),
    },
    periodStats: input.includePresetPeriodStats
      ? buildPresetPeriodStats(input.incidents, input.websiteAddedAt, now)
      : [],
    customStats: input.includePresetPeriodStats
      ? null
      : computePeriodStats(
          input.customLabel ??
            formatCustomPeriodLabel(from, to, now),
          from,
          to,
          input.incidents,
          now
        ),
  };
}

export function parseMetricsQuery(input: {
  range?: string;
  from?: string;
  to?: string;
  now?: Date;
}):
  | { ok: true; window: ResolvedWindow; includePresetPeriodStats: boolean }
  | { ok: false } {
  const now = input.now ?? new Date();

  if (input.from && input.to) {
    const from = new Date(input.from);
    const to = new Date(input.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { ok: false };
    }

    if (from.getTime() >= to.getTime()) {
      return { ok: false };
    }

    return {
      ok: true,
      window: resolveCustomRange(from, to),
      includePresetPeriodStats: false,
    };
  }

  if (
    input.range === 'hour' ||
    input.range === 'day' ||
    input.range === 'week' ||
    input.range === 'month'
  ) {
    return {
      ok: true,
      window: resolveMetricsRange(input.range, now),
      includePresetPeriodStats: true,
    };
  }

  return { ok: false };
}
