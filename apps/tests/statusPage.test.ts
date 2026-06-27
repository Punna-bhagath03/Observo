import { describe, it, expect } from 'bun:test';
import {
  buildPublicStatusPage,
  formatPublicIncident,
  isValidStatusPageSlug,
  slugBaseFromUrl,
} from 'store/statusPage';

const now = new Date('2026-06-25T12:00:00Z');

describe('status page slug helpers', () => {
  it('validates slug format', () => {
    expect(isValidStatusPageSlug('my-site')).toBe(true);
    expect(isValidStatusPageSlug('a1')).toBe(true);
    expect(isValidStatusPageSlug('-bad')).toBe(false);
    expect(isValidStatusPageSlug('bad-')).toBe(false);
    expect(isValidStatusPageSlug('')).toBe(false);
  });

  it('derives slug base from url hostname', () => {
    expect(slugBaseFromUrl('https://www.example.com/path')).toBe(
      'www-example-com'
    );
    expect(slugBaseFromUrl('not-a-url')).toBe('status');
  });
});

describe('public status page payload', () => {
  it('sanitizes incidents and builds monitor summary', () => {
    const incident = formatPublicIncident({
      id: 'inc-1',
      started_at: new Date('2026-06-25T10:00:00Z'),
      resolved_at: new Date('2026-06-25T10:30:00Z'),
    });

    expect(incident.ongoing).toBe(false);
    expect(incident.duration_ms).toBe(30 * 60_000);
    expect(incident).not.toHaveProperty('acknowledged_by');

    const page = buildPublicStatusPage({
      url: 'https://example.com',
      slug: 'example-com',
      regionId: 'region-india',
      regionName: 'India',
      websiteAddedAt: new Date('2026-06-01T00:00:00Z'),
      ticks24h: [
        {
          status: 'Up',
          response_time_ms: 120,
          createdAt: new Date('2026-06-25T11:57:00Z'),
        },
      ],
      latestTick: {
        status: 'Up',
        response_time_ms: 120,
        createdAt: new Date('2026-06-25T11:57:00Z'),
      },
      monitorStreakStartAt: new Date('2026-06-25T11:00:00Z'),
      allIncidents: [
        {
          started_at: new Date('2026-06-25T10:00:00Z'),
          resolved_at: new Date('2026-06-25T10:30:00Z'),
        },
      ],
      recentIncidents: [
        {
          id: 'inc-1',
          started_at: new Date('2026-06-25T10:00:00Z'),
          resolved_at: new Date('2026-06-25T10:30:00Z'),
        },
      ],
      windowStart: new Date('2026-06-24T12:00:00Z'),
      windowEnd: now,
      now,
    });

    expect(page.url).toBe('https://example.com');
    expect(page.slug).toBe('example-com');
    expect(page.region).toBe('India');
    expect(page.regionId).toBe('region-india');
    expect(page.monitor.status).toBe('Up');
    expect(page.periodStats.length).toBe(5);
    expect(page.incidents).toHaveLength(1);
    expect(page.stats24h.totalChecks).toBe(1);
  });
});
