import { describe, it, expect } from 'bun:test';
import {
  bucketResponseTimes,
  buildWebsiteMetrics,
  clipIncidentDurationMs,
  computeIncidentDowntime,
  computeMonitorSummary,
  computeMonitorSummaryFromState,
  resolveStreakStartAt,
  computePeriodStats,
  formatCustomPeriodLabel,
  getBucketMs,
  incidentOverlapsPeriod,
  parseMetricsQuery,
  resolveCustomRange,
  resolveMetricsRange,
} from 'store/metrics';

const now = new Date('2026-06-25T12:00:00Z');

describe('metrics range resolution', () => {
  it('resolves preset ranges with expected bucket sizes', () => {
    expect(resolveMetricsRange('hour', now).bucketMs).toBe(60_000);
    expect(resolveMetricsRange('day', now).bucketMs).toBe(15 * 60_000);
    expect(resolveMetricsRange('week', now).bucketMs).toBe(3_600_000);
    expect(resolveMetricsRange('month', now).bucketMs).toBe(6 * 3_600_000);
  });

  it('auto-buckets custom ranges toward 300 points', () => {
    const from = new Date('2026-06-01T00:00:00Z');
    const to = new Date('2026-06-25T00:00:00Z');
    const bucketMs = getBucketMs(from, to);

    expect(bucketMs).toBeGreaterThanOrEqual(60_000);
    expect(
      Math.ceil((to.getTime() - from.getTime()) / bucketMs)
    ).toBeLessThanOrEqual(300);
  });

  it('parses range and custom query modes', () => {
    expect(parseMetricsQuery({ range: 'day' })?.ok).toBe(true);
    expect(
      parseMetricsQuery({
        from: '2026-06-01T00:00:00Z',
        to: '2026-06-10T00:00:00Z',
      })?.ok
    ).toBe(true);
    expect(parseMetricsQuery({ range: 'invalid' })?.ok).toBe(false);
    expect(
      parseMetricsQuery({
        from: '2026-06-10T00:00:00Z',
        to: '2026-06-01T00:00:00Z',
      })?.ok
    ).toBe(false);
  });
});

describe('metrics bucketing', () => {
  it('computes bucket availability from ticks', () => {
    const from = new Date('2026-06-25T11:00:00Z');
    const to = new Date('2026-06-25T11:30:00Z');
    const points = bucketResponseTimes(
      [
        {
          status: 'Up',
          response_time_ms: 100,
          createdAt: new Date('2026-06-25T11:05:00Z'),
        },
        {
          status: 'Down',
          response_time_ms: 100,
          createdAt: new Date('2026-06-25T11:10:00Z'),
        },
        {
          status: 'Up',
          response_time_ms: 300,
          createdAt: new Date('2026-06-25T11:20:00Z'),
        },
      ],
      from,
      to,
      15 * 60_000
    );

    expect(points.length).toBe(2);
    expect(points[0]?.availability).toBe(50);
    expect(points[0]?.avgMs).toBe(100);
    expect(points[1]?.avgMs).toBe(300);
    expect(points[1]?.maxMs).toBe(300);
  });
});

describe('metrics incident downtime', () => {
  const incident = {
    started_at: new Date('2026-06-25T10:00:00Z'),
    resolved_at: new Date('2026-06-25T11:00:00Z'),
  };

  it('clips incident overlap to the requested period', () => {
    const from = new Date('2026-06-25T10:30:00Z');
    const to = new Date('2026-06-25T12:00:00Z');

    expect(clipIncidentDurationMs(incident, from, to, now)).toBe(30 * 60_000);
    expect(incidentOverlapsPeriod(incident, from, to, now)).toBe(true);
  });

  it('includes open incidents until now', () => {
    const openIncident = {
      started_at: new Date('2026-06-25T11:30:00Z'),
      resolved_at: null,
    };
    const from = new Date('2026-06-25T11:00:00Z');
    const to = new Date('2026-06-25T12:00:00Z');

    expect(clipIncidentDurationMs(openIncident, from, to, now)).toBe(
      30 * 60_000
    );
    expect(
      computeIncidentDowntime([openIncident], from, to, now)
    ).toBe(30 * 60_000);
  });

  it('computes period availability from incident downtime', () => {
    const from = new Date('2026-06-25T10:00:00Z');
    const to = new Date('2026-06-25T12:00:00Z');
    const row = computePeriodStats('Today', from, to, [incident], now);

    expect(row.downtimeMs).toBe(60 * 60_000);
    expect(row.availability).toBe(50);
    expect(row.incidents).toBe(1);
    expect(row.longestIncidentMs).toBe(60 * 60_000);
    expect(row.avgIncidentMs).toBe(60 * 60_000);
  });
});

describe('metrics monitor summary', () => {
  it('returns checking when there are no ticks', () => {
    const summary = computeMonitorSummary([], [], now);

    expect(summary.status).toBe('checking');
    expect(summary.upForMs).toBeNull();
    expect(summary.checkIntervalMinutes).toBe(3);
  });

  it('tracks continuous up time from the latest up streak', () => {
    const summary = computeMonitorSummary(
      [
        {
          status: 'Up',
          response_time_ms: 100,
          createdAt: new Date('2026-06-25T11:00:00Z'),
        },
        {
          status: 'Down',
          response_time_ms: 100,
          createdAt: new Date('2026-06-25T10:00:00Z'),
        },
        {
          status: 'Up',
          response_time_ms: 120,
          createdAt: new Date('2026-06-25T11:30:00Z'),
        },
      ],
      [],
      now
    );

    expect(summary.status).toBe('Up');
    expect(summary.upForMs).toBe(60 * 60_000);
    expect(summary.lastCheckedAt).toBe('2026-06-25T11:30:00.000Z');
  });

  it('derives up time from explicit streak start state', () => {
    const summary = computeMonitorSummaryFromState(
      {
        status: 'Up',
        response_time_ms: 120,
        createdAt: new Date('2026-06-25T11:30:00Z'),
      },
      new Date('2026-06-25T11:00:00Z'),
      [],
      now
    );

    expect(summary.status).toBe('Up');
    // Streak started at 11:00, now is 12:00 → 1 hour up (not 30m since last check)
    expect(summary.upForMs).toBe(60 * 60_000);
  });

  it('resolves streak start after the latest down tick', () => {
    const streakStart = resolveStreakStartAt({
      latest: {
        status: 'Up',
        response_time_ms: 120,
        createdAt: new Date('2026-06-25T11:30:00Z'),
      },
      lastDown: {
        status: 'Down',
        response_time_ms: 100,
        createdAt: new Date('2026-06-25T10:00:00Z'),
      },
      firstUpAfterLastDown: {
        status: 'Up',
        response_time_ms: 110,
        createdAt: new Date('2026-06-25T11:00:00Z'),
      },
      firstUpEver: null,
      websiteAddedAt: new Date('2026-06-18T00:00:00Z'),
    });

    expect(streakStart.toISOString()).toBe('2026-06-25T11:00:00.000Z');
  });
});

describe('metrics period labels', () => {
  it('formats custom labels as since/until today', () => {
    const from = new Date(2026, 5, 18);
    const to = new Date(2026, 5, 26, 15, 0, 0);
    const label = formatCustomPeriodLabel(from, to, to);

    expect(label).toBe('Since 18 Jun 2026 until today');
  });

  it('formats historical custom labels with an end date', () => {
    const from = new Date(2026, 5, 1);
    const to = new Date(2026, 5, 10);
    const label = formatCustomPeriodLabel(
      from,
      to,
      new Date(2026, 5, 25)
    );

    expect(label).toBe('Since 1 Jun 2026 until 10 Jun 2026');
  });
});

describe('buildWebsiteMetrics', () => {
  it('returns preset period stats for range mode', () => {
    const metrics = buildWebsiteMetrics({
      ticks: [
        {
          status: 'Up',
          response_time_ms: 100,
          createdAt: new Date('2026-06-25T11:45:00Z'),
        },
      ],
      incidents: [],
      websiteAddedAt: new Date('2026-06-18T00:00:00Z'),
      window: resolveMetricsRange('day', now),
      includePresetPeriodStats: true,
      now,
    });

    expect(metrics.graph.range).toBe('day');
    expect(metrics.periodStats.length).toBe(5);
    expect(metrics.customStats).toBeNull();
    expect(metrics.monitor.status).toBe('Up');
  });

  it('returns custom stats for custom mode', () => {
    const from = new Date('2026-06-20T00:00:00Z');
    const to = new Date('2026-06-25T00:00:00Z');
    const metrics = buildWebsiteMetrics({
      ticks: [],
      incidents: [
        {
          started_at: new Date('2026-06-21T00:00:00Z'),
          resolved_at: new Date('2026-06-21T01:00:00Z'),
        },
      ],
      websiteAddedAt: new Date('2026-06-18T00:00:00Z'),
      window: resolveCustomRange(from, to),
      includePresetPeriodStats: false,
      now: to,
    });

    expect(metrics.graph.range).toBe('custom');
    expect(metrics.periodStats.length).toBe(0);
    expect(metrics.customStats?.label).toMatch(/^Since .+ until (today|\d{1,2} \w{3} \d{4})$/);
    expect(metrics.customStats?.incidents).toBe(1);
    expect(metrics.customStats?.downtimeMs).toBe(60 * 60_000);
  });
});
